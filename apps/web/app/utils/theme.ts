import { createTheme } from '@mantine/core';

import ExtendedActionIcon from '~/components/extended/ExtendedActionIcon';
import ExtendedAvatar from '~/components/extended/ExtendedAvatar';
import ExtendedButton from '~/components/extended/ExtendedButton';
import ExtendedCard from '~/components/extended/ExtendedCard';
import ExtendedCheckbox from '~/components/extended/ExtendedCheckbox';
import ExtendedColorPicker from '~/components/extended/ExtendedColorPicker';
import ExtendedDatePickerInput from '~/components/extended/ExtendedDatePickerInput';
import ExtendedDateTimePicker from '~/components/extended/ExtendedDateTimePicker';
import ExtendedMenu from '~/components/extended/ExtendedMenu';
import ExtendedModal from '~/components/extended/ExtendedModal';
import ExtendedMultiSelect from '~/components/extended/ExtendedMultiSelect';
import ExtendedNotification from '~/components/extended/ExtendedNotification';
import ExtendedPasswordInput from '~/components/extended/ExtendedPasswordInput';
import ExtendedPinInput from '~/components/extended/ExtendedPinInput';
import ExtendedPopover from '~/components/extended/ExtendedPopover';
import ExtendedSelect from '~/components/extended/ExtendedSelect';
import ExtendedTextInput from '~/components/extended/ExtendedTextInput';

const theme = createTheme({
    primaryColor: 'primary',
    components: {
        Button: ExtendedButton,
        TextInput: ExtendedTextInput,
        PasswordInput: ExtendedPasswordInput,
        Card: ExtendedCard,
        ColorPicker: ExtendedColorPicker,
        Select: ExtendedSelect,
        DateTimePicker: ExtendedDateTimePicker,
        Notification: ExtendedNotification,
        Avatar: ExtendedAvatar,
        ActionIcon: ExtendedActionIcon,
        PinInput: ExtendedPinInput,
        DatePickerInput: ExtendedDatePickerInput,
        Checkbox: ExtendedCheckbox,
        Modal: ExtendedModal,
        Menu: ExtendedMenu,
        MultiSelect: ExtendedMultiSelect,
        Popover: ExtendedPopover,
    },
    colors: {
        primary: [
            'oklch(0.9866 0.0227 95.95);',
            'oklch(0.9564 0.0579 91.09);',
            'oklch(0.9154 0.1166 91.89);',
            'oklch(0.8658 0.1545 86.59);',
            'oklch(0.8203 0.1665 77.52);',
            'oklch(0.7672 0.173 62.38);',
            'oklch(0.6565 0.174757 49.5243);',
            'oklch(0.5477 0.1638 42.2);',
            'oklch(0.4671 0.1416 39.97);',
            'oklch(0.4065 0.1189 39.78);',
        ],
        red: [
            'oklch(0.971 0.013 17.38)',
            'oklch(0.936 0.032 17.717)',
            'oklch(0.885 0.062 18.334)',
            'oklch(0.808 0.114 19.571)',
            'oklch(0.704 0.191 22.216)',
            'oklch(0.637 0.237 25.331)',
            'oklch(0.577 0.245 27.325)',
            'oklch(0.505 0.213 27.518)',
            'oklch(0.444 0.177 26.899)',
            'oklch(0.396 0.141 25.723)',
        ],
    },
    primaryShade: 5,
    fontFamily: 'Inter Variable, sans-serif',
});

export default theme;
