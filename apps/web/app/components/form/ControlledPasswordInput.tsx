import { PasswordInput, type PasswordInputProps } from '@mantine/core';
import { useFormContext } from 'react-hook-form';

interface ControlledPasswordInputProps extends PasswordInputProps {
  name: string;
}

const ControlledPasswordInput = ({ name, ...props }: ControlledPasswordInputProps) => {
  const {
    register,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();

  return (
    <PasswordInput
      {...props}
      {...register(name)}
      error={errors?.[name]?.message as string}
      aria-invalid={!!errors?.[name]?.message}
      readOnly={props.readOnly || isLoading || isSubmitting}
    />
  );
};

export default ControlledPasswordInput;
