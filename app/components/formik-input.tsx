import React from "react";
import { useField } from "formik";
import { ListInput } from "konsta/react";

interface FormikInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  info?: string;
  formatValue?: (value: string) => string;
  media?: React.ReactNode | string;
  children?: React.ReactNode;
  inputClassName?: string;
  readonly?: boolean;
}

export const FormikInput: React.FC<FormikInputProps> = ({
  name,
  label,
  type = "text",
  placeholder,
  info,
  formatValue,
  media = null,
  children,
  inputClassName,
  readonly = false,
}) => {
  const [field, meta, helpers] = useField(name);

  const showError = meta.touched && meta.error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly) return;
    const val = e.target.value;
    if (formatValue) {
      helpers.setValue(formatValue(val));
    } else {
      field.onChange(e);
    }
  };

  return (
    <ListInput
      media={media}
      label={label}
      type={type}
      placeholder={placeholder}
      info={info}
      value={field.value}
      onChange={handleChange}
      onBlur={field.onBlur}
      name={field.name}
      error={showError ? meta.error : ""}
      inputClassName={`${inputClassName ?? ""} ${readonly ? "opacity-60 cursor-not-allowed select-none" : ""}`}
      readOnly={readonly}
    >
      {children}
    </ListInput>
  );
};
