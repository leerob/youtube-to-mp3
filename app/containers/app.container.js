import React, { Component } from 'react';
import Axios from 'axios';
const { ipcRenderer } = window.require('electron')
import LinkInput from '../components/LinkInput';
import ProgressBar from '../components/ProgressBar';



class AppContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showProgressBar: false,
      progress: 0
    };

    this.interval = null;
    this.api_key = '5a142a55461d5fef016acfb927fee0bd';
    this.fetchVideo = this.fetchVideo.bind(this);
    this.startDownload = this.startDownload.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.retryDownload = this.retryDownload.bind(this);
    this.downloadFinished = this.downloadFinished.bind(this);
  }

  startDownload(id) {
    this.setState({
      progress: 0,
      showProgressBar: true
    });

    // Start incrementing the progress bar
    this.interval = setInterval(
      () => this.updateProgress(),
      300
    );

    this.fetchVideo(id);
  }

  fetchVideo(id) {
    let _this = this;
    Axios.get(`http://www.yt-mp3.com/fetch?v=${id}&apikey=${this.api_key}`)
      .then(function (response) {
        console.log(response);
        if (response.data.status === 'timeout') {
          _this.retryDownload(id);
        } else if (response.data.url) {
          _this.downloadFinished(response.data.url);
        } else {
          _this.retryDownload(id);
        }
      })
      .catch(function (err) {
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
    setTimeout(
      () => this.setState({
        showProgressBar: false
      }),
      1000
    );
  }

  updateProgress() {
    if (this.state.progress < 100) {
      this.setState({
        progress: this.state.progress + 1
      });
    }
  }

  render() {
    if (this.state.showProgressBar) {
      return <ProgressBar progress={this.state.progress} />;
    } else {
      return <LinkInput startDownload={this.startDownload} />;
    }
  }
}

export default AppContainer;
