import "../styles/icons.css";
import injectSheet from 'react-jss';
import * as React from 'react';

const styles = {
    font: {
        fontFamily: 'e-icons',
    },
    searchIcon: { "&:before": { content: '"\\e993"' } },
    closeIcon: { "&:before": { content: '"\\eb36"' } },
}

export enum IconName {
    search = "searchIcon",
    close = "closeIcon"
}

export interface IIconProps {
    iconName: IconName,
    onClick?: React.MouseEventHandler<any>
    className: string
}

const IconUnStyled: React.FunctionComponent<IIconProps> = (
    props: any
) => {
    debugger;
    const { classes, iconName } = props;
    return (
        <span className={`${props.className} ${classes.font} ${classes[iconName]} `} onClick={props.onClick} />
    );
}

export const Icon = injectSheet(styles)(IconUnStyled) as React.FunctionComponent<IIconProps>;
