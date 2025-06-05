import { DatePickerInput } from '@mantine/dates';

const ExtendedDatePickerInput = DatePickerInput.extend({
  classNames: {
    input: 'rounded-lg shadow-sm',
    day: 'orangecloud-day',
  },
  defaultProps: {
    popoverProps: {
      classNames: {
        dropdown: 'rounded-lg shadow-lg',
      },
    },
  },
});

export default ExtendedDatePickerInput;
