import { Popover } from '@mantine/core';

const ExtendedPopover = Popover.extend({
  classNames: {
    dropdown: 'rounded-lg shadow-lg',
  },
});

export default ExtendedPopover;
