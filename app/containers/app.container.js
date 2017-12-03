import React, {Component} from 'react';
import Axios from 'axios';
import LinkInput from '../components/LinkInput';
import ProgressBar from '../components/ProgressBar';

const {ipcRenderer} = window.require('electron');

class AppContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showProgressBar: false,
      progress: 0,
      progressMessage: 'Sending request..',
    };

    this.interval = null;
    this.api_key = 'yt-mp3.com';
    this.fetchVideo = this.fetchVideo.bind(this);
    this.startDownload = this.startDownload.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.retryDownload = this.retryDownload.bind(this);
    this.downloadFinished = this.downloadFinished.bind(this);
  }

  startDownload(id) {
    this.setState({
      progress: 0,
      showProgressBar: true,
      progressMessage: 'Sending request...',
    });
    this.fetchVideo(id);
  }

  fetchVideo(id) {
    let _this = this;
    Axios.get(`http://www.yt-mp3.com/fetch?v=${id}&apikey=${this.api_key}`).then(function (response) {
      if (response.data.status.localeCompare('timeout') === 0) {
        _this.setState({progressMessage: 'Waiting on yt-mp3 worker...'});
        _this.retryDownload(id);
      } else if (response.data.url) {
        _this.updateProgress(100);
        _this.setState({progressMessage: 'Conversion complete!'});
        _this.downloadFinished(response.data.url);
      } else {
        _this.setState({progressMessage: 'Converting video...'});
        _this.updateProgress(response.data.progress);
        _this.retryDownload(id);
      }
    }).catch((e) => {
      console.error(e);
      alert('There was an error retrieving the video. Please restart the application.');
    });
  }

  // The video has been placed in a queue, retry in 5 seconds
  retryDownload(id) {
    setTimeout(
      () => this.fetchVideo(id),
      5000
    );
  }

  downloadFinished(url) {
    this.setState({
      progress: 100
    });

    // Prompt the user to save the file
    ipcRenderer.send('download-file', url);

    // Clear the progress bar incrementation
    clearInterval(this.interval);

    // Reset the progress bar to the LinkInput
    setTimeout(() => this.setState({
      showProgressBar: false
    }), 1000);
  }

  updateProgress(progress) {
    if (this.state.progress <= 100) {
      this.setState({
        progress: Math.floor(progress)
      });
    }
  }

  render() {
    if (this.state.showProgressBar) {
      return <ProgressBar progress={this.state.progress} messageText={this.state.progressMessage}/>;
    } else {
      return <LinkInput startDownload={this.startDownload}/>;
    }
  }
}

export default AppContainer;
