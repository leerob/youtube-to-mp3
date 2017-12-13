import React, {Component} from 'react';

class TabControl extends Component {
  constructor(props){
    super(props);

    this.switchTabs = this.switchTabs.bind(this);
  }

  switchTabs(tabId) {
    if(tabId === 0) {
      this.props.tabSwap(true);
    } else {
      this.props.tabSwap(false);
    }
  }

  render() {
    let isInputTabSelected = this.props.selecedTab;
    let queueQty = this.props.queueQty;

    return (
      <div className='tabs'>
        <div onClick={()=>this.switchTabs(0)} className={isInputTabSelected ? 'tab active' : 'tab'}>Add to queue</div>
        <div onClick={()=>this.switchTabs(1)} className={isInputTabSelected ? 'tab' : 'tab active'}>Progress <span className='badge'>{queueQty}</span></div>
      </div>
    );
  }
}

export default TabControl;