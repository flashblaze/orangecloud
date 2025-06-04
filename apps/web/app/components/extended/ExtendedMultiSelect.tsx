import { MultiSelect } from '@mantine/core';

const ExtendedMultiSelect = MultiSelect.extend({
  classNames: {
    input: 'rounded-lg shadow-sm',
    dropdown: 'rounded-lg shadow-lg',
    option: 'rounded-lg',
    pill: 'rounded-lg shadow-sm',
  },
});

export default ExtendedMultiSelect;
