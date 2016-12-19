import Label from './Label';
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
// import TextareaAutosize from 'react-textarea-autosize';
import classNames from 'classnames';

export default class TextField extends Component {

	static propTypes = {
		autoFocus: PropTypes.bool,
		className: PropTypes.any,
		countCurrent: PropTypes.any,
		countMax: PropTypes.any,
		disabled: PropTypes.bool,
		fullWidth: PropTypes.bool,
		hint: PropTypes.string,
		label: PropTypes.string,
		multiLine: PropTypes.bool,
		onChange: PropTypes.func,
		onKeyDown: PropTypes.func,
		type: PropTypes.string,
		value: PropTypes.any
	};

	static defaultProps = {
		multiLine: false,
		type: 'text'
	};

	componentDidMount() {
		if (this.props.autoFocus) ReactDOM.findDOMNode(this.refs.inputElement).focus();
	}

	render() {

		let { className, countCurrent, countMax, disabled, fullWidth, hint, label, onChange, onKeyDown, type, value } = this.props;

		className = classNames('textfield', fullWidth && 'fullWidth', disabled && 'disabled', className);

		const hintElement = hint ? (
			<div className={classNames('textfield-hint', value && 'hide')}>{hint}</div>
		) : null;

		// const inputElement = this.props.multiLine ? (
		// 	<TextareaAutosize
		// 		defaultValue={value}
		// 		onChange={onChange}
		// 		onKeyPress={onKeyDown}
		// 	/>
		// ) : (
		const inputElement = (
			<input
				type={type}
				value={value}
				onChange={onChange}
				onKeyPress={onKeyDown}
				ref='inputElement'
			/>
		);

		const counterTextElement = countMax ? (
			<div>{countCurrent} / {countMax}</div>
		) : null;

		return (
			<div className={className}>
				{hintElement}
				<Label text={label} />
				{inputElement}
				{counterTextElement}
			</div>
		);
	}
}