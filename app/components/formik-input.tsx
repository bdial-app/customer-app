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
}) => {
  const [field, meta, helpers] = useField(name);

  const showError = meta.touched && meta.error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      inputClassName={inputClassName}
    >
      {children}
    </ListInput>
  );
};
