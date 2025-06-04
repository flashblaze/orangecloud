import { PasswordInput } from '@mantine/core';
import IconCharmEyeSlash from '~icons/charm/eye-slash';
import IconTablerEye from '~icons/tabler/eye';

const ExtendedPasswordInput = PasswordInput.extend({
  classNames: {
    input: 'rounded-lg shadow-sm',
    visibilityToggle: '!shadow-none',
  },
  defaultProps: {
    visibilityToggleIcon: ({ reveal }: { reveal: boolean }) =>
      reveal ? <IconTablerEye /> : <IconCharmEyeSlash />,
  },
});

export default ExtendedPasswordInput;
