"use client";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { memo } from "react";
import { Sheet } from "@/app/components/ui/sheet";

const AppUpdatePrompt = memo(function AppUpdatePrompt() {
  const { showUpdatePrompt, isForceUpdate, updateInfo, dismiss } = useAppUpdate();

  // A sheet on phones (drag down for "later"), a dialog on wide screens.
  // A required update can't be dismissed.
  return (
    <Sheet
      open={showUpdatePrompt && !!updateInfo}
      onClose={dismiss}
      label={isForceUpdate ? "Update required" : "Update available"}
      zIndex={10000}
      wideWidth="max-w-sm"
      dismissible={!isForceUpdate}
      handle={!isForceUpdate}
      className="bg-white dark:bg-slate-800"
    >
      {updateInfo && (
      <div className="px-6 pt-3 pb-6 sm:pt-6">
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-center text-slate-800 dark:text-white mb-2">
          {isForceUpdate ? "Update Required" : "Update Available"}
        </h3>

        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-1">
          Version {updateInfo.latestVersion} is available.
          {isForceUpdate
            ? " You must update to continue using the app."
            : " Update for the latest features and fixes."}
        </p>

        {updateInfo.releaseNotes && (
          <p className="text-xs text-center text-slate-400 dark:text-slate-500 mb-4 italic">
            {updateInfo.releaseNotes}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-5">
          <a
            href={updateInfo.updateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-amber-500 text-white font-bold text-sm rounded-xl text-center active:scale-95 transition-transform"
          >
            Update Now
          </a>
          {!isForceUpdate && (
            <button
              onClick={dismiss}
              className="w-full py-3 text-slate-500 dark:text-slate-400 font-medium text-sm rounded-xl active:scale-95 transition-transform"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
      )}
    </Sheet>
  );
});

export default AppUpdatePrompt;
