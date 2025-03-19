export declare enum TypeElementEnum {
    HEADER = 'header',
    BODY = 'body',
    FOOTER = 'footer',
}

export interface ElementCMSI {
    id: number;
    name: string;
    description: string;
    icon: string;
    css: string;
    config: {
        [key: string]: any;
    };
    text: {
        [key: string]: any;
    };
    status: boolean;
    type: TypeElementEnum[];
    dataText?: ElementDataI[];
}

export interface ElementDataI {
    [key: string]: string;
}
