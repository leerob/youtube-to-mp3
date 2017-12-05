import React, {Component} from 'react';
import LinkInput from '../components/LinkInput';
import ProgressBar from '../components/ProgressBar';

const ytdl = window.require('ytdl-core');
const fs = window.require('fs');
import * as path from "path";

const {remote} = window.require('electron');

class AppContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showProgressBar: false,
      progress: 0,
      progressMessage: '',
    };

    this.rateLimitTrigged = false;
    this.startDownload = this.startDownload.bind(this);
    this.retryDownload = this.retryDownload.bind(this);
    this.downloadFinished = this.downloadFinished.bind(this);
  }

  getVideoAndConvert(urlLink, userProvidedPath, title){
    this.setState({progressMessage: 'Downloading and converting...'});
    return new Promise((resolve, reject) => {
      let fullPath = path.join(userProvidedPath, `${title}.mp3`);
      let videoObject = ytdl(urlLink, {filter: 'audioonly'});

      videoObject
        .on('progress', (chunkLength, downloaded, total) => {
          if(!this.rateLimitTrigged) {
            let newval = Math.floor((downloaded / total) * 100).toString();
            this.setState({progress: newval});
            this.rateLimitTrigged = true;
            setTimeout(()=>{this.rateLimitTrigged = false}, 800);
          }
        });

      videoObject
        .pipe(fs.createWriteStream(fullPath))
        .on('finish', () => {
          resolve();
        });
    });
  }

  async ConvertVideoToMp3(urlLink, userProvidedPath) {
    try{
      this.setState({progressMessage: 'Fetching video info...'});
      let info = await ytdl.getInfo(urlLink);
      await this.getVideoAndConvert(urlLink, userProvidedPath, info.title);
    } catch(e) {
      console.error(e);
    }
  }

  async startDownload(id) {
    this.setState({
      progress: 0,
      showProgressBar: true,
      progressMessage: 'Where do you want to store the mp3?',
    });

    try {
      let d = remote.dialog.showOpenDialog({properties: ['openDirectory'], title: 'Select folder to store file.'});
      if(d) {
        let pathForFile = d[0];
        await this.ConvertVideoToMp3(id, pathForFile);
        this.downloadFinished();
      }
    } catch(e) {
      console.error(e);
    }

    // this.fetchVideo(id);
  }

  retryDownload(id) {
    setTimeout(
      () => this.fetchVideo(id),
      5000
    );
  }

  downloadFinished() {
    this.setState({
      progress: 100,
      progressMessage: 'Conversion successful! Resetting in 5 seconds.'
    });

    // Reset the progress bar to the LinkInput
    setTimeout(() => this.setState({
      showProgressBar: false
    }), 6000);
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
