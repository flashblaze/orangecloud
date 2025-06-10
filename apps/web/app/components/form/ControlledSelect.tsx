import { Select, type SelectProps } from '@mantine/core';
import { get, useController, useFormContext } from 'react-hook-form';

export interface ControlledSelectProps extends SelectProps {
  name: string;
}

const ControlledSelect: React.FC<ControlledSelectProps> = ({ name, readOnly, ...props }) => {
  const {
    control,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();
  const { field } = useController({ name, control });

  return (
    <Select
      {...props}
      value={field.value}
      onChange={(value) => field.onChange(value)}
      error={get(errors, name)?.message}
      aria-invalid={!!get(errors, name)}
      readOnly={readOnly || isLoading || isSubmitting}
    />
  );
};

export default ControlledSelect;
