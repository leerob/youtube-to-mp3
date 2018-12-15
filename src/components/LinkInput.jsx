import React, {Component} from 'react';

class LinkInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inputValue: '',
            showError: false
        };

        this.updateInputValue = this.updateInputValue.bind(this);
        this.startDownload = this.startDownload.bind(this);
        this.getIdFromUrl = this.getIdFromUrl.bind(this);
    }

    getIdFromUrl(url) {
        let id = '';
        let regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        let match = url.match(regExp);

        if (match && match[2].length == 11) {
            return match[2];
        } else {
            return null;
        }
    }

    updateInputValue(e) {
        this.setState({
            inputValue: e.target.value,
            showError: false
        });
    }

    startDownload() {
        let id = this.getIdFromUrl(this.state.inputValue);
        if (id === null) {
            this.setState({
                showError: true
            });
        } else {
            this.props.startDownload(id);
        }
    }

    render() {
        let className = `link__input${this.state.showError ? '--error' : ''}`;
        return (
            <div>
                <input
                    className={className}
                    onChange={this.updateInputValue}
                    placeholder="https://www.youtube.com/watch?v=zmXUWKwxDg4"
                />
                <div className="center">
                    <button className="link__button" onClick={this.startDownload}>
                        Convert to .mp3
                    </button>
                </div>
            </div>
        );
    }
}

export default LinkInput;
