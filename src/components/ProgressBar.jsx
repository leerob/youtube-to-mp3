import React, {Component} from 'react';

class ProgressBar extends Component {
    render() {
        let percentComplete = `${this.props.progress}%`;
        let messageToShow = `${this.props.messageText}`;
        let color = '#747373';

        if (this.props.progress > 90) {
            color = 'white';
        }

        return (
            <div>
                <div className="progress">
                    <div className="progress__bar" style={{width: percentComplete}} />
                    <div className="progress__percentage" style={{color: color}}>
                        {percentComplete}
                    </div>
                </div>
                <div className="center">
                    <span className="progress__info">{messageToShow}</span>
                </div>
            </div>
        );
    }
}

export default ProgressBar;
