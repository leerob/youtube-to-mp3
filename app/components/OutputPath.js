import React, {Component} from 'react';

class OutputPath extends Component {
  constructor(props){
    super(props);

    this.changeOutputLocation = this.changeOutputLocation.bind(this);
  }

  changeOutputLocation(){
    this.props.changeLocation();
  }

  render(){
    return (
      <div className="output_folder_display">
        <a onClick={this.changeOutputLocation}>Change</a>
        <span style={{paddingLeft: '5px'}}>Current output folder:</span><span> {this.props.userSelectedFolder}</span>
      </div>
    );
  }
}

export default OutputPath;