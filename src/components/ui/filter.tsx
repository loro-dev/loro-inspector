import { useCallback, useMemo } from "react";
import { debounce } from "throttle-debounce";
import { Input, InputProps } from "@/components/ui/input";

export function FilterInput({
  onChange,
  ...props
}: {
  onChange?: (searchParam: string) => void;
} & Omit<InputProps, "onChange">) {
  const handleChange = useMemo(
    () =>
      debounce(500, (e: string) => {
        onChange?.(e);
      }),
    [onChange],
  );

  return (
    <Input
      type="search"
      placeholder="Filter by name"
      {...props}
      // eslint-disable-next-line
      onChange={useCallback(
        ((e) => {
          handleChange(e.target.value);
        }) as React.ChangeEventHandler<HTMLInputElement>,
        [handleChange],
      )}
    />
  );
}
