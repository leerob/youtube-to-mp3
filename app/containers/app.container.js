import React, {Component} from 'react';
import LinkInput from '../components/LinkInput';
import ProgressBar from '../components/ProgressBar';

const ytdl = window.require('ytdl-core');
const fs = window.require('fs-extra');
import * as path from 'path';

const ffmpeg = window.require('fluent-ffmpeg');
const binaries = window.require('ffmpeg-binaries');
const sanitize = window.require('sanitize-filename');

const {remote} = window.require('electron');

class AppContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showProgressBar: false,
      progress: 0,
      progressMessage: '',
      userDownloadsFolder: remote.app.getPath('downloads'),
    };

    this.rateLimitTriggered = false;
    this.startDownload = this.startDownload.bind(this);
    this.downloadFinished = this.downloadFinished.bind(this);
  }

  getVideoAsMp4(urlLink, userProvidedPath, title){
    this.setState({progressMessage: 'Downloading...'});
    return new Promise((resolve, reject) => {
      let fullPath = path.join(userProvidedPath, `tmp_${title}.mp4`);
      let videoObject = ytdl(urlLink, {filter: 'audioonly'});

      videoObject
        .on('progress', (chunkLength, downloaded, total) => {
          if(!this.rateLimitTriggered) {
            let newVal = Math.floor((downloaded / total) * 100).toString();
            this.setState({progress: newVal});
            this.rateLimitTriggered = true;
            setTimeout(()=>{this.rateLimitTriggered = false}, 800);
          }
        });

      videoObject
        .pipe(fs.createWriteStream(fullPath))
        .on('finish', () => {
          this.setState({progress: 100});
          setTimeout(()=>{
            resolve({filePath: fullPath, folderPath: userProvidedPath, fileTitle: `${title}.mp3`});
          }, 1000);
        });
    });
  }

  convertMp4ToMp3(paths) {
    this.setState({progressMessage: 'Converting...', progress: 0});
    return new Promise((resolve, reject) => {
      this.rateLimitTriggered = false;
      ffmpeg(paths.filePath)
        .setFfmpegPath(binaries.ffmpegPath())
        .format('mp3')
        .on('progress', (progress) => {
          if (!this.rateLimitTriggered) {
            this.setState({progress: Math.floor(progress.percent)});
            this.rateLimitTriggered = true;
            setTimeout(() => {
              this.rateLimitTriggered = false
            }, 800);
          }
        })
        .output(fs.createWriteStream(path.join(paths.folderPath, sanitize(paths.fileTitle))))
        .on('end', () => {
          this.setState({progress: 99});
          resolve();
        })
        .run();
    });

  }

  async convertVideoToMp3(urlLink, userProvidedPath) {
    try{
      this.setState({progressMessage: 'Fetching video info...'});
      let info = await ytdl.getInfo(urlLink);
      let paths = await this.getVideoAsMp4(urlLink, userProvidedPath, info.title);
      await this.convertMp4ToMp3(paths);
      fs.unlinkSync(paths.filePath);
      await (() => {
        return new Promise((resolve, reject) => {
          setTimeout(()=>{
            this.setState({progress: 100});
            resolve();
          },900);
        });
      });
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
        await this.convertVideoToMp3(id, this.state.userDownloadsFolder);
        this.downloadFinished();
    } catch(e) {
      console.error(e);
    }
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
