import { type MantineThemeComponent, Popover } from '@mantine/core';

const ExtendedPopover: MantineThemeComponent = Popover.extend({
  classNames: {
    dropdown: 'rounded-lg shadow-lg',
  },
});

export default ExtendedPopover;
