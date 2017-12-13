import LinkInput from '../components/LinkInput';
import ProgressBar from '../components/ProgressBar';

import React, {Component} from 'react';

import * as path from 'path';
import TabControl from "../components/TabControl";

const ffmpeg = window.require('fluent-ffmpeg');
const binaries = window.require('ffmpeg-binaries');
const sanitize = window.require('sanitize-filename');
const {ipcRenderer, remote} = window.require('electron');
const ytdl = window.require('ytdl-core');
const fs = window.require('fs-extra');

class AppContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputTabSelected: true,
      showProgressBar: false,
      progress: 0,
      progressMessage: 'No items in queue',
      userDownloadsFolder: localStorage.getItem('userSelectedFolder') ? localStorage.getItem('userSelectedFolder') : remote.app.getPath('downloads'),
      workingOnVideo: false,
      downloadQueue: [],
    };

    // Signal from main process to show prompt to change the download to folder.
    ipcRenderer.on('promptForChangeDownloadFolder', () => {
      // Changing the folder in renderer because we need access to both state and local storage.
      this.changeOutputFolder();
    });

    // This property will be used to control the rate at which the progress bar is updated to prevent UI lag.
    this.rateLimitTriggered = false;

    this.swapTab = this.swapTab.bind(this);
    this.startDownload = this.startDownload.bind(this);
    this.downloadFinished = this.downloadFinished.bind(this);
    this.addDownloadToQueue = this.addDownloadToQueue.bind(this);
    this.changeOutputFolder = this.changeOutputFolder.bind(this);
  }

  getVideoAsMp4(urlLink, userProvidedPath, title) {
    // Tell the user we are starting to get the video.
    this.setState({progressMessage: 'Downloading...'});
    return new Promise((resolve, reject) => {
      let fullPath = path.join(userProvidedPath, `tmp_${title}.mp4`);

      // Create a reference to the stream of the video being downloaded.
      let videoObject = ytdl(urlLink, {filter: 'audioonly'});

      videoObject
        .on('progress', (chunkLength, downloaded, total) => {
          // When the stream emits a progress event, we capture the currently downloaded amount and the total
          // to download, we then divided the downloaded by the total and multiply the result to get a float of
          // the percent complete, which is then passed through the Math.floor function to drop the decimals.
          if (!this.rateLimitTriggered) {
            let newVal = Math.floor((downloaded / total) * 100);
            this.setState({progress: newVal});

            // Set the rate limit trigger to true and set a timeout to set it back to false. This will prevent the UI
            // from updating every few milliseconds and creating visual lag.
            this.rateLimitTriggered = true;
            setTimeout(() => {
              this.rateLimitTriggered = false
            }, 800);
          }
        });

      // Create write-able stream for the temp file and pipe the video stream into it.
      videoObject
        .pipe(fs.createWriteStream(fullPath))
        .on('finish', () => {
          // all of the video stream has finished piping, set the progress bar to 100% and give user pause to see the
          // completion of step. Then we return the path to the temp file, the output path, and the desired filename.
          this.setState({progress: 100});
          setTimeout(() => {
            resolve({filePath: fullPath, folderPath: userProvidedPath, fileTitle: `${title}.mp3`});
          }, 1000);
        });
    });
  }

  convertMp4ToMp3(paths) {
    // Tell the user we are starting to convert the file to mp3.
    this.setState({progressMessage: 'Converting...', progress: 0});

    return new Promise((resolve, reject) => {
      // Reset the rate limiting trigger just encase.
      this.rateLimitTriggered = false;

      // Pass ffmpeg the temp mp4 file. Set the path where is ffmpeg binary for the platform. Provided desired format.
      ffmpeg(paths.filePath)
        .setFfmpegPath(binaries.ffmpegPath())
        .format('mp3')
        .audioBitrate(160)
        .on('progress', (progress) => {
          // Use same rate limiting as above in function "getVideoAsMp4()" to prevent UI lag.
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
          // After the mp3 is wrote to the disk we set the progress to 99% the last 1% is the removal of the temp file.
          this.setState({progress: 99});
          resolve();
        })
        .run();
    });
  }

  async startDownload(id) {
    // Reset state for each download/conversion
    this.setState({
      progress: 0,
      showProgressBar: true,
      progressMessage: '...',
      workingOnVideo: true,
    });

    try {
      // Tell the user we are getting the video info, and call the function to do so.
      this.setState({progressMessage: 'Fetching video info...'});
      let info = await ytdl.getInfo(id);

      // Given the id of the video, the path in which to store the output, and the video title
      // download the video as an audio only mp4 and write it to a temp file then return
      // the full path for the tmp file, the path in which its stored, and the title of the desired output.
      let paths = await this.getVideoAsMp4(id, this.state.userDownloadsFolder, info.title);

      // Pass the returned paths and info into the function which will convert the mp4 tmp file into
      // the desired output mp3 file.
      await this.convertMp4ToMp3(paths);

      // Remove the temp mp4 file.
      fs.unlinkSync(paths.filePath);

      // Set the bar to 100% and give the OS about one second to get rid of the temp file.
      await (() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this.setState({progress: 100});
            resolve();
          }, 900);
        });
      });

      // Signal that the download and conversion have completed and we need to tell the user about it and then reset.
      this.downloadFinished();
    } catch (e) {
      console.error(e);
    }
  }

  downloadFinished() {
    // Make sure progress bar is at 100% and tell the user we have completed the task successfully.
    this.setState({
      progress: 100,
      progressMessage: 'Conversion successful!'
    });

    let currentQueue = [...this.state.downloadQueue];
    currentQueue.pop();

    this.setState({
      workingOnVideo: false,
      downloadQueue: [...currentQueue]
    });

    if(this.state.downloadQueue.length > 0) {
      setTimeout(() => {
        this.startDownload(this.state.downloadQueue[0]);
      }, 2000);
    } else {
      setTimeout(() => {
        this.setState({
          progress: 0,
          progressMessage: 'No items in queue',
        });
      }, 2000);
    }

  }

  addDownloadToQueue(id) {
    // test url:    https://www.youtube.com/watch?v=Ssvu2yncgWU
    let currentQueue = [...this.state.downloadQueue];
    currentQueue.push(id);
    this.setState({downloadQueue: [...currentQueue]});

    if(this.state.downloadQueue.length > 0 && !this.state.workingOnVideo) {
      setTimeout(() => {
        this.startDownload(this.state.downloadQueue[0]);
      }, 2000);
    }
  }

  changeOutputFolder() {
    // Create an electron open dialog for selecting folders, this will take into account platform.
    let fileSelector = remote.dialog.showOpenDialog({defaultPath: `${this.state.userDownloadsFolder}`, properties: ['openDirectory'], title: 'Select folder to store files.'});

    // If a folder was selected and not just closed, set the localStorage value to that path and adjust the state.
    if (fileSelector) {
      let pathToStore = fileSelector[0];
      localStorage.setItem('userSelectedFolder', pathToStore);
      this.setState({userDownloadsFolder: pathToStore});
      console.log(`New current path ${localStorage.getItem('userSelectedFolder')}`)
    }
  }

  swapTab(isInputTab) {
    this.setState({inputTabSelected: isInputTab});
  }

  render() {
    if (!this.state.inputTabSelected) {
      return (
        <div>
          <TabControl tabSwap={this.swapTab} selecedTab={this.state.inputTabSelected} queueQty={this.state.downloadQueue.length}/>
          <ProgressBar progress={this.state.progress} messageText={this.state.progressMessage} />
        </div>
      );
    } else {
      return (
        <div>
          <TabControl tabSwap={this.swapTab} selecedTab={this.state.inputTabSelected} queueQty={this.state.downloadQueue.length} />
          <LinkInput startDownload={this.addDownloadToQueue} />
        </div>
      );
    }

  }
}

export default AppContainer;
