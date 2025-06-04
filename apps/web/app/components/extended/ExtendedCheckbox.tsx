import { Checkbox } from '@mantine/core';

const ExtendedCheckbox = Checkbox.extend({
  classNames: {
    root: 'instaclock-checkbox',
    input: 'rounded-md shadow-sm',
  },
});

export default ExtendedCheckbox;
