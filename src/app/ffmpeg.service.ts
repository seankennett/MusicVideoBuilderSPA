import { Injectable } from '@angular/core';
import { Video } from './video';
import { Clip } from './clip';
import { Resolution } from './resolution';
import { Displaylayer } from './displaylayer';
import { Layer } from './layer';
import { Fadetypes } from './fadetypes';
import { Formats } from './formats';
import { Ffmpegcodes } from './ffmpegcodes';

const OutputFrameRate = 24;
const MinimumBpm = 90;
const FramesInLayer = 64;
const FramesPerBeat = 16;
const BeatsPerDisplayLayer = 4;

@Injectable({
  providedIn: 'root'
})
export class FfmpegService {
  constructor() { }

  AllFramesVideoName = 'allframes';

  generateCodes = (video: Video, clips: Clip[], resolution: Resolution, hasAudio: boolean, videoDisplayLayers: Displaylayer[]):Ffmpegcodes => {
    var clipCodes: string[] = [];
    clips.forEach(clip => {
      if (video.videoClips.some(vc => vc.clipId === clip.clipId)) {
        var orderedDisplayLayers = clip.clipDisplayLayers?.map(cd => videoDisplayLayers.find(d => d.displayLayerId === cd.displayLayerId) ?? <Displaylayer>{}) ?? [];
        clipCodes.push(this.generateClipCode(clip, orderedDisplayLayers, video.bpm, resolution, video.format));
      }
    });

    var allFrameVideoFileName = `${this.AllFramesVideoName}.${Formats[video.format]}`;
    var clipMergeCommand = this.getMergeCode(allFrameVideoFileName, `${this.AllFramesVideoName}.txt`);
    var videoFinishingCommand = this.finishVideo(allFrameVideoFileName, hasAudio, video.videoDelayMilliseconds, video.videoName, video.format);

    var concatFileCode = '';
    video.videoClips.forEach(vc => {
      concatFileCode += `file '${vc.clipId}.${Formats[video.format]}'\r\n`
    });
    return <Ffmpegcodes>{
      ffmpegCodes: `${clipCodes.join('\r\n')}\r\n${clipMergeCommand}\r\n${videoFinishingCommand}`,
      concatFileCode: concatFileCode
    }
  }

  generateClipCode = (clip: Clip, displayLayers: Displaylayer[], bpm: number, resolution: Resolution, format: Formats): string => {
    var command = { str: 'ffmpeg ' }
    var uniqueLayers = displayLayers?.flatMap(d => d.layers);
    var inputList = this.buildInputList(bpm, uniqueLayers, command, resolution, clip.backgroundColour, false);
    command.str += `-filter_complex "`;
    inputList = this.buildLayerCommand(command, clip, inputList, displayLayers);
    this.buildClipCommand(command, clip.backgroundColour, inputList, uniqueLayers);
    this.buildClipFilterCommand(command, clip);

    command.str += `" ${clip.clipId}.${Formats[format]}`;
    return command.str;
  }

  resolutionToBlobPrefix = (resolution: Resolution) => {
    var resolutionBlobPrefix = 'free';
    switch (resolution) {
      case Resolution.FourK:
        resolutionBlobPrefix = '4k';
        break;
      case Resolution.Hd:
        resolutionBlobPrefix = 'hd';
        break;
    }
    return resolutionBlobPrefix;
  }

  resolutionToSize = (resolution: Resolution) => {
    var size = '384x216';
    switch (resolution) {
      case Resolution.FourK:
        size = '3840x2160';
        break;
      case Resolution.Hd:
        size = '1920x1080';
        break;
    }
    return size;
  }

  buildInputList = (bpm: number, uniqueLayers: Layer[] | null, command: {str: string}, resolution: Resolution, backgroundColour: string | null, hasAudio: boolean) => {
    const inputList: { id: string; ffmpegReference: string }[] = [];
    const framerate = `${bpm * OutputFrameRate}/${MinimumBpm}`;
    let overallIndex = 0;

    if (uniqueLayers !== null) {
      for (let i = 0; i < uniqueLayers.length; i++) {
        const userLayer = uniqueLayers[i];
        command.str += `-framerate ${framerate} -i ${userLayer.layerId}/${this.resolutionToBlobPrefix(resolution)}/%d.png `;
        inputList.push({ id: userLayer.layerId, ffmpegReference: `[${overallIndex}:v]` });
        overallIndex++;
      }
    }

    if (backgroundColour !== null) {
      command.str += `-f lavfi -i color=0x${backgroundColour.toUpperCase()}@1:s=${this.resolutionToSize(resolution)}:r=${framerate} `;
      inputList.push({ id: backgroundColour, ffmpegReference: `[${overallIndex}:v]` });
      overallIndex++;
    }

    if (hasAudio === true) {
      command.str += `-i "audio.mp3" `;
    }

    return inputList;
  }

  createTargetIds = (backgroundColour: string | null, uniqueLayers: Layer[] | null): string[] => {
    const targetIds: string[] = [];

    if (backgroundColour !== null) {
      targetIds.push(backgroundColour);
    }

    if (uniqueLayers !== null) {
      targetIds.push(...uniqueLayers.map(x => x.layerId.toString()));
    }

    return targetIds;
  }

  buildLayerCommand = (
    command: {str: string},
    clip: Clip,
    splitLayers: { id: string; ffmpegReference: string }[],
    uniqueDisplayLayers: Displaylayer[]
  ): { id: string; ffmpegReference: string }[] => {
    const hasMultipleLayers =
      this.createTargetIds(
        clip.backgroundColour,
        uniqueDisplayLayers?.flatMap(x => x.layers)
      ).length > 1;
    let i = 0;

    if (clip.backgroundColour !== null) {
      const matchingInputindex = splitLayers.findIndex(x => x.id === clip.backgroundColour);
      const matchedReference = splitLayers[matchingInputindex].ffmpegReference;
      command.str += `${matchedReference}trim=end_frame=${FramesInLayer},format=gbrp`;
      if (clip.endBackgroundColour !== null) {
        command.str += `,fade=out:s=0:n=${FramesInLayer}:c=#${clip.endBackgroundColour}`;
      }

      if (hasMultipleLayers) {
        this.updateFfmpegReference(command, splitLayers, i, matchingInputindex);
        i++;
      }
    }

    if (uniqueDisplayLayers !== null) {
      for (const displayLayer of uniqueDisplayLayers) {
        const matchedClipDisplayLayer = clip.clipDisplayLayers.find(
          c => c.displayLayerId === displayLayer.displayLayerId
        );

        if (matchedClipDisplayLayer) {
          for (const layer of displayLayer.layers) {
            const matchingInputindex = splitLayers.findIndex(x => x.id === layer.layerId);
            const matchedReference = splitLayers[matchingInputindex].ffmpegReference;

            let hasUsedReference = false;

            if (matchedClipDisplayLayer.reverse) {
              command.str += `${matchedReference}reverse`;
              hasUsedReference = true;
            }

            if (matchedClipDisplayLayer.flipHorizontal) {
              command.str += `${hasUsedReference ? ',' : matchedReference}hflip`;
              hasUsedReference = true;
            }

            if (matchedClipDisplayLayer.flipVertical) {
              command.str += `${hasUsedReference ? ',' : matchedReference}vflip`;
              hasUsedReference = true;
            }

            if (!layer.isOverlay) {
              const matchedOverrideLayer = matchedClipDisplayLayer.layerClipDisplayLayers.find(
                x => x.layerId === layer.layerId
              );

              if (matchedOverrideLayer) {
                const startColour = this.convertToColor(matchedOverrideLayer.colour);
                const singleQuote = "'";

                if (matchedOverrideLayer.endColour === null) {
                  command.str +=
                    `${hasUsedReference ? ',' : matchedReference}geq=r=${singleQuote}r(X,Y)*(${startColour.R}/255)${singleQuote}:` +
                    `b=${singleQuote}b(X,Y)*(${startColour.B}/255)${singleQuote}:g=${singleQuote}g(X,Y)*(${startColour.G}/255)${singleQuote}`
                    ;
                } else {
                  const framesInLayer = FramesInLayer - 1;
                  const endColour = this.convertToColor(matchedOverrideLayer.endColour);
                  command.str +=
                    `${hasUsedReference ? ',' : matchedReference}geq=r=${singleQuote}r(X,Y)/${framesInLayer}*` +
                    `(N*(${endColour.R}/255)+${framesInLayer}*(${startColour.R}/255)-N*(${startColour.R}/255))${singleQuote}:` +
                    `b=${singleQuote}b(X,Y)/${framesInLayer}*` +
                    `(N*(${endColour.B}/255)+${framesInLayer}*(${startColour.B}/255)-N*(${startColour.B}/255))${singleQuote}:` +
                    `g=${singleQuote}g(X,Y)/${framesInLayer}*` +
                    `(N*(${endColour.G}/255)+${framesInLayer}*(${startColour.G}/255)-N*(${startColour.G}/255))${singleQuote}`
                    ;
                }

                command.str += ',format=gbrp';
                hasUsedReference = true;
              }
            }

            if (matchedClipDisplayLayer.fadeType !== null) {
              const fadeCommand = Fadetypes[matchedClipDisplayLayer.fadeType].toLowerCase();
              command.str +=
                `${hasUsedReference ? ',' : matchedReference}fade=${fadeCommand}:s=0:n=${FramesInLayer}`
                ;

              if (matchedClipDisplayLayer.colour !== null) {
                command.str += `:c=#${matchedClipDisplayLayer.colour}`;
              } else if (layer.isOverlay) {
                command.str += ':alpha=1';
              }

              hasUsedReference = true;
            }

            if (hasUsedReference && hasMultipleLayers) {
              this.updateFfmpegReference(command, splitLayers, i, matchingInputindex);
            }
            i++;
          }
        }
      }
    }
    return splitLayers;
  }

  updateFfmpegReference = (command: {str: string}, splitLayers: { id: string; ffmpegReference: string; }[], index: number, matchingInputindex: number) => {
    const output = `[l${index}]`;
    command.str += `${output};`;
    splitLayers[matchingInputindex] = { id: splitLayers[matchingInputindex].id, ffmpegReference: output };
  }

  convertToColor(hexCode: string): { R: number; G: number; B: number } {
    // Assuming the hex code is a 6-digit hex color (e.g., "RRGGBB")
    const bigint = parseInt(hexCode, 16);

    const R = (bigint >> 16) & 255;
    const G = (bigint >> 8) & 255;
    const B = bigint & 255;

    return { R, G, B };
  }

  buildClipCommand = (
    command: {str: string},
    backgroundColour: string | null,
    splitLayers: { id: string; ffmpegReference: string }[],
    uniqueLayers: Layer[] | null
  ): void => {
    const targetIds = this.createTargetIds(backgroundColour, uniqueLayers);

    // Either solid background color or one layer with no watermark will not do anything
    if (targetIds.length > 1) {
      let previousOutputReference = '';
      for (let j = 0; j < targetIds.length - 1; j++) {
        if (j === 0) {
          const targetId = targetIds[j];
          previousOutputReference = splitLayers.find(x => x.id === targetId)?.ffmpegReference || '';
        }

        const nextTargetId = targetIds[j + 1];
        const nextFfmpegReference = splitLayers.find(x => x.id === nextTargetId)?.ffmpegReference || '';

        const outputReference = `[o${j}]`;

        const nextMatchingLayer = uniqueLayers?.find(x => x.layerId.toString() === nextTargetId);
        if (nextMatchingLayer && !nextMatchingLayer.isOverlay) {
          command.str += `${previousOutputReference}${nextFfmpegReference}blend=all_mode=screen`;
        } else {
          command.str += `${previousOutputReference}${nextFfmpegReference}overlay`;
        }

        command.str += ',format=gbrp';

        // If not the last iteration
        if (j !== targetIds.length - 2) {
          command.str += `${outputReference};`;
        }

        previousOutputReference = outputReference;
      }
    }
  }

  buildClipFilterCommand = (command: {str: string}, clip: Clip): void => {
    if (clip.beatLength !== BeatsPerDisplayLayer) {
      // For plain background, no watermark, or layers as using commas and trim
      if (command.str.includes('trim=end_frame=')) {
        command.str += '[c0];[c0]';
      } else {
        command.str += ',';
      }

      const startFrame = (clip.startingBeat - 1) * FramesPerBeat;
      const endFrame = startFrame + clip.beatLength * FramesPerBeat;

      // When adding more filters then need to think about [c0] or , (using [c0] for safe just background)
      command.str += `trim=start_frame=${startFrame}:end_frame=${endFrame},setpts=PTS-STARTPTS`;
    }
  }
  getMergeCode = (
    outputVideoName: string,
    concatFileName: string
  ): string => {
    var command = `ffmpeg -f concat -i ${concatFileName} `;

    command += `-c copy ${outputVideoName}`;
    return command;
  }

  finishVideo = (allFrameVideoFileName: string, hasAudio: boolean, videoDelayMilliseconds: number | null, videoName: string, format: Formats) : string => {
    var command = `ffmpeg -i ${allFrameVideoFileName} `
    if (hasAudio === true){
      command += `-i audio.mp3 `
    }

    command += `-filter_complex "fps=${OutputFrameRate},format=yuv420p`
    if (videoDelayMilliseconds){
      command += `,tpad=start_duration=${videoDelayMilliseconds}ms:start_mode=clone`;
    }

    command += `" ${videoName}.${Formats[format]}`;
    return command;
  }
}
