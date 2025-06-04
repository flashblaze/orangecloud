import { DateTimePicker } from '@mantine/dates';

const ExtendedDateTimePicker = DateTimePicker.extend({
  classNames: {
    input: 'rounded-lg shadow-sm',
  },
  defaultProps: {
    popoverProps: {
      classNames: {
        dropdown: 'rounded-lg shadow-lg',
      },
    },
    timePickerProps: {
      withDropdown: true,
      classNames: {
        input: 'rounded-lg shadow-sm',
      },
    },
  },
});

export default ExtendedDateTimePicker;
