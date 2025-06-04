import { ColorPicker } from '@mantine/core';

const ExtendedColorPicker = ColorPicker.extend({
  defaultProps: {
    classNames: {
      slider: 'shadow-sm',
      saturationOverlay: 'shadow-sm rounded-lg',
    },
  },
});

export default ExtendedColorPicker;
