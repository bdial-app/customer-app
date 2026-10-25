"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IonIcon } from "@ionic/react";
import {
  attachOutline,
  checkmarkCircle,
  closeCircle,
  documentTextOutline,
  flowerOutline,
  hourglassOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import { isAxiosError } from "axios";
import { PROVIDER_STATUS_KEY } from "@/hooks/useMyProvider";
import { AppDialog } from "../app-dialog";
import { Card, FieldBlock, GroupLabel, ManageSheet, Pill, PrimaryButton, SecondaryButton, inputCls, textareaCls } from "./manage/kit";
import {
  ROLE_OPTIONS,
  getMyWomenLed,
  requestWomenLed,
  turnOffWomenLed,
  uploadWomenLedProof,
  withdrawWomenLed,
  type MyWomenLed,
  type WomenLedRole,
} from "@/services/women-led.service";

const errorText = (e: unknown, fallback: string) => {
  if (isAxiosError(e)) {
    const m = (e.response?.data as { message?: string | string[] } | undefined)?.message;
    if (typeof m === "string") return m;
    if (Array.isArray(m) && m[0]) return m[0];
  }
  return fallback;
};

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

/**
 * Women-Led in the business dashboard: ask for the badge (the team checks it
 * against the ID given for verification), see where it stands, withdraw a
 * request, or turn it off — at once; turning it on again is checked again.
 */
export function WomenLedCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-women-led"], queryFn: getMyWomenLed, staleTime: 30_000 });
  const [asking, setAsking] = useState(false);
  const [confirm, setConfirm] = useState<"withdraw" | "turnOff" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const set = (d: MyWomenLed) => qc.setQueryData(["my-women-led"], d);
  const withdraw = useMutation({
    mutationFn: withdrawWomenLed,
    onSuccess: (d) => { set(d); setConfirm(null); },
    onError: (e) => setActionError(errorText(e, "Couldn't withdraw it. Please try again.")),
  });
  const turnOff = useMutation({
    mutationFn: () => turnOffWomenLed(),
    onSuccess: (d) => { set(d); setConfirm(null); qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY }); },
    onError: (e) => setActionError(errorText(e, "Couldn't turn it off. Please try again.")),
  });

  if (!data) return null;
  const { state, request, perks } = data;
  const perkLine = `a Women-Led badge, a place in the Women-Led section, and ${perks.freeLeads} free lead unlocks a month instead of ${perks.normalFreeLeads}`;

  return (
    <>
      <GroupLabel>Women-Led</GroupLabel>
      <Card>
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-600/20">
            <IonIcon icon={flowerOutline} className="text-white text-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[15px] font-bold text-slate-900 dark:text-white">Women-Led business</p>
              {state === "approved" && <Pill tone="emerald"><IonIcon icon={checkmarkCircle} /> On</Pill>}
              {state === "pending" && <Pill tone="amber"><IonIcon icon={hourglassOutline} /> Being checked</Pill>}
              {state === "rejected" && <Pill tone="rose">Not approved</Pill>}
              {state === "revoked" && <Pill tone="rose">Removed</Pill>}
            </div>

            {state === "off" && (
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
                Is a woman owning or running this business? Ask for {perkLine}.
              </p>
            )}
            {state === "pending" && request && (
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
                Our team is checking <b className="text-slate-700 dark:text-slate-200">{request.womanName}</b> ({ROLE_OPTIONS.find((r) => r.value === request.role)?.label.toLowerCase()}) against the ID you gave for verification, usually within 2 working days. Asked {fmt(request.requestedAt)}.
              </p>
            )}
            {state === "approved" && (
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
                Your shop shows the Women-Led badge, appears in the Women-Led section, and gets {perks.freeLeads} free lead unlocks a month.
              </p>
            )}
            {(state === "rejected" || state === "revoked") && (
              <div className="mt-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 px-3 py-2">
                <p className="text-[12.5px] font-semibold text-rose-700 dark:text-rose-300">
                  {state === "rejected" ? "Our team couldn't approve it" : "Our team removed the badge"}
                </p>
                {request?.reason && <p className="text-[12.5px] text-rose-700/90 dark:text-rose-200/90 leading-snug mt-0.5">{request.reason}</p>}
              </div>
            )}
          </div>
        </div>

        {actionError && <p className="mt-3 text-[12px] font-medium text-rose-500">{actionError}</p>}

        <div className="mt-3.5">
          {(state === "off" || state === "rejected" || state === "revoked") && (
            <PrimaryButton full size="sm" icon={flowerOutline} onClick={() => { setActionError(null); setAsking(true); }}>
              {state === "off" ? "Ask for the Women-Led badge" : "Ask again"}
            </PrimaryButton>
          )}
          {state === "pending" && (
            <SecondaryButton full size="sm" onClick={() => { setActionError(null); setConfirm("withdraw"); }}>
              Withdraw request
            </SecondaryButton>
          )}
          {state === "approved" && (
            <SecondaryButton full size="sm" onClick={() => { setActionError(null); setConfirm("turnOff"); }}>
              Turn off Women-Led
            </SecondaryButton>
          )}
        </div>
      </Card>

      {asking && (
        <AskSheet
          data={data}
          onClose={() => setAsking(false)}
          onDone={(d) => { set(d); setAsking(false); }}
        />
      )}

      <AppDialog
        open={confirm === "turnOff"}
        onClose={() => setConfirm(null)}
        icon={closeCircle}
        iconColor="text-rose-500"
        iconBg="bg-rose-50"
        title="Turn off Women-Led?"
        description={`The badge and your place in the Women-Led section go straight away, and free lead unlocks go back to ${perks.normalFreeLeads} a month. To turn it on again, our team will check it again.`}
        confirmLabel="Turn off"
        cancelLabel="Keep it"
        confirmColor="red"
        onConfirm={() => turnOff.mutate()}
        isLoading={turnOff.isPending}
        loadingLabel="Turning off…"
      />
      <AppDialog
        open={confirm === "withdraw"}
        onClose={() => setConfirm(null)}
        icon={hourglassOutline}
        iconColor="text-amber-500"
        iconBg="bg-amber-50"
        title="Withdraw your request?"
        description="Our team will stop checking it. You can ask again at any time."
        confirmLabel="Withdraw"
        cancelLabel="Keep it"
        confirmColor="amber"
        onConfirm={() => withdraw.mutate()}
        isLoading={withdraw.isPending}
        loadingLabel="Withdrawing…"
      />
    </>
  );
}

/** Who she is, her role, optional proof, and a clear "this is true". */
function AskSheet({ data, onClose, onDone }: { data: MyWomenLed; onClose: () => void; onDone: (d: MyWomenLed) => void }) {
  const [womanName, setWomanName] = useState(data.request?.womanName || data.ownerName || "");
  const [role, setRole] = useState<WomenLedRole | null>(data.request?.role ?? null);
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [proof, setProof] = useState<{ evidenceKey: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = useMutation({
    mutationFn: () =>
      requestWomenLed({
        womanName: womanName.trim(),
        role: role!,
        confirm: true,
        note: note.trim() || undefined,
        ...(proof ? { evidenceKey: proof.evidenceKey, evidenceName: proof.name, evidenceType: proof.type } : {}),
      }),
    onSuccess: onDone,
    onError: (e) => setError(errorText(e, "Couldn't send it. Please try again.")),
  });

  const pickProof = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    if (file.size > 10 * 1024 * 1024) { setError("The file must be under 10 MB."); return; }
    setUploading(true);
    try {
      // One retry: a dropped connection shouldn't lose the file.
      setProof(await uploadWomenLedProof(file).catch(() => uploadWomenLedProof(file)));
    } catch (e) {
      setError(errorText(e, "The file didn't upload. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const ready = womanName.trim().length >= 2 && !!role && agreed && !uploading;

  return (
    <ManageSheet
      open
      onClose={onClose}
      title="Women-Led badge"
      subtitle="Our team checks it before the badge shows"
      footer={
        <div className="flex flex-col gap-2">
          {error && <p className="text-[12px] font-medium text-rose-500 text-center">{error}</p>}
          <PrimaryButton full icon={shieldCheckmarkOutline} disabled={!ready} loading={send.isPending} onClick={() => send.mutate()}>
            Send for checking
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <FieldBlock label="Her name" hint="As on her ID, so the team can match it.">
          <input value={womanName} onChange={(e) => setWomanName(e.target.value.slice(0, 100))} placeholder="e.g. Fatema Burhani" className={inputCls} autoComplete="name" />
        </FieldBlock>

        <FieldBlock label="Her role in the business">
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Her role">
            {ROLE_OPTIONS.map((o) => {
              const on = role === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setRole(o.value)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left ring-1 transition-colors ${on ? "bg-purple-50 dark:bg-purple-950/40 ring-purple-400" : "bg-slate-50 dark:bg-slate-800 ring-slate-200 dark:ring-slate-700"}`}
                >
                  <span className={`w-5 h-5 rounded-full ring-2 flex items-center justify-center shrink-0 ${on ? "ring-purple-500" : "ring-slate-300 dark:ring-slate-600"}`}>
                    {on && <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-slate-900 dark:text-white">{o.label}</span>
                    <span className="block text-[12px] text-slate-500 dark:text-slate-400">{o.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </FieldBlock>

        <FieldBlock label="Proof" optional hint="Udyam certificate, GST or shop licence in her name. Only the Tijarah team can see it.">
          {proof ? (
            <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
              <IonIcon icon={documentTextOutline} className="text-[18px] text-purple-500 shrink-0" />
              <span className="flex-1 min-w-0 truncate text-[13.5px] text-slate-700 dark:text-slate-200">{proof.name}</span>
              <button type="button" onClick={() => setProof(null)} aria-label="Remove the file" className="shrink-0">
                <IonIcon icon={closeCircle} className="text-[20px] text-slate-400" />
              </button>
            </div>
          ) : (
            <label className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-[13.5px] font-semibold text-slate-600 dark:text-slate-300 ${uploading ? "opacity-60" : "cursor-pointer"}`}>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" disabled={uploading} onChange={(e) => void pickProof(e.target.files?.[0])} />
              <IonIcon icon={attachOutline} className="text-[18px]" />
              {uploading ? "Uploading…" : "Add a photo or PDF"}
            </label>
          )}
        </FieldBlock>

        <FieldBlock label="Anything the team should know" optional>
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={2} placeholder="e.g. My mother started the shop in 2015 and still runs it" className={textareaCls} />
        </FieldBlock>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-5 h-5 accent-purple-600 shrink-0" />
          <span className="text-[13px] text-slate-600 dark:text-slate-300 leading-snug">
            I confirm this is true. Tijarah may call to check it, and can remove the badge if it isn&apos;t.
          </span>
        </label>
      </div>
    </ManageSheet>
  );
}
