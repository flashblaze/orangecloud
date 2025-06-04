import { PinInput } from '@mantine/core';

const ExtendedPinInput = PinInput.extend({
  classNames: {
    input: 'rounded-lg shadow-sm',
    root: 'mb-0',
  },
  defaultProps: {
    type: 'number',
  },
});

export default ExtendedPinInput;
