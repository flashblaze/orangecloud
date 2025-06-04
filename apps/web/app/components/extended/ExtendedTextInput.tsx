import { TextInput } from '@mantine/core';

const ExtendedTextInput = TextInput.extend({
  classNames: {
    input: 'rounded-lg shadow-sm',
  },
});

export default ExtendedTextInput;
