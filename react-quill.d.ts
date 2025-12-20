declare module 'react-quill' {
    import { Component, CSSProperties } from 'react';

    export interface ReactQuillProps {
        value?: string;
        defaultValue?: string;
        onChange?: (content: string, delta: any, source: any, editor: any) => void;
        onChangeSelection?: (range: any, source: any, editor: any) => void;
        onFocus?: (range: any, source: any, editor: any) => void;
        onBlur?: (previousRange: any, source: any, editor: any) => void;
        onKeyPress?: (event: any) => void;
        onKeyDown?: (event: any) => void;
        onKeyUp?: (event: any) => void;
        placeholder?: string;
        readOnly?: boolean;
        modules?: any;
        formats?: string[];
        style?: CSSProperties;
        className?: string;
        theme?: string;
        tabIndex?: number;
        bounds?: string | HTMLElement;
        scrollingContainer?: string | HTMLElement;
        preserveWhitespace?: boolean;
    }

    export default class ReactQuill extends Component<ReactQuillProps> { }
}
