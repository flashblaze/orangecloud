import { Select } from '@mantine/core';

const ExtendedSelect = Select.extend({
  classNames: {
    input: 'rounded-lg shadow-sm',
    dropdown: 'rounded-lg shadow-lg',
  },
  defaultProps: {
    allowDeselect: false,
  },
});

export default ExtendedSelect;
