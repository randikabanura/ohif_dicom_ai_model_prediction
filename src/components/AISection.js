import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stateDetails from '../state';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

class AISection extends Component {
  state = {
    name: '',
    modality: '',
    organ: '',
    task: '',
    data_description: '',
    model_description: '',
    additional_info: '',
    model_performance: '',
    website: '',
    citation: '',
    version: '',
    modelsDetails: [],
  };

  dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI
      .split(',')[0]
      .split(':')[1]
      .split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var arrayBuffer = new ArrayBuffer(byteString.length);
    var _ia = new Uint8Array(arrayBuffer);
    for (var i = 0; i < byteString.length; i++) {
      _ia[i] = byteString.charCodeAt(i);
    }

    var dataView = new DataView(arrayBuffer);
    var blob = new Blob([dataView], { type: mimeString });
    return blob;
  }

  handleChange = event => {
    const { value } = event.target;

    var found = stateDetails.modelsDetails.filter(function(data) {
      return data.id === value;
    });
    const endpoint = `${found[0].infoApi}?model_id=${value}`;

    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        const value_params = data.data;

        this.setState({
          name: value_params.name,
          modality: value_params.modality,
          organ: value_params.organ,
          task: value_params.task,
          data_description: value_params.data_description,
          model_description: value_params.model_description,
          additional_info: value_params.additional_info,
          model_performance: value_params.model_performance,
          website: value_params.website,
          citation: value_params.citation,
          version: value_params.version,
        });
      });
  };

  handlePredictionClick = event => {
    event.preventDefault();

    const { UINotificationService } = this.props.servicesManager.services;

    const input = document.getElementById('model-selection');
    const modelId = input.value;
    var found = stateDetails.modelsDetails.filter(function(data) {
      return data.id === input.value;
    });

    const endpoint = `${found[0].predictionApi}`;
    const activeEnabledElement = cornerstone.getEnabledElements()[0];
    const formData = new FormData();
    let imageBlob = null
    if(typeof activeEnabledElement.image.getCanvas  === "function") {
      imageBlob = this.dataURItoBlob(
          activeEnabledElement.image.getCanvas().toDataURL()
      );
    }else {
      imageBlob = this.dataURItoBlob(
          activeEnabledElement.canvas.toDataURL()
      );
    }

    formData.append('image', imageBlob);
    formData.append('modelId', modelId);
    formData.append('rows', activeEnabledElement.image.rows);
    formData.append('columns', activeEnabledElement.image.columns);

    const requestOptions = {
      method: 'POST',
      body: formData,
    };

    const pendingNotificationId = UINotificationService.show({
      title: 'Pending',
      message: 'Trying to process the request',
      position: 'bottomLeft',
    });

    fetch(endpoint, requestOptions)
      .then(response => response.json())
      .then(responseJson => {
        stateDetails.predictionResults = responseJson.data.attributes;
        if (responseJson.data.sections) {
          stateDetails.sectionResults = responseJson.data.sections;
        }
        document
          .getElementsByClassName('tab-list-item results-section')[0]
          .click();

        stateDetails.sectionResults.map(function(sectionItem) {
          if (sectionItem.start && sectionItem.end) {
            this.drawRect(sectionItem.start, sectionItem.end);
          }
        }, this);
        UINotificationService.hide({ pendingNotificationId });
        UINotificationService.show({
          title: 'Success',
          message: 'Successfully gained prediction results!!!',
          position: 'bottomLeft',
          duration: 4000,
          type: 'success',
        });
      })
      .catch(error => {
        return console.log(error);
      });
  };

  drawRect(start_data, end_data) {
    const activeEnabledElement = cornerstone.getEnabledElements()[0];

    if (!activeEnabledElement) {
      return;
    }

    const canvas = activeEnabledElement.canvas;
    const context = canvas.getContext('2d');
    const element = activeEnabledElement.element;

    var start = { x: start_data.x, y: start_data.y };
    var end = { x: end_data.x, y: end_data.y };

    const measurementData = {
      visible: true,
      active: true,
      invalidated: true,
      handles: {
        start: {
          x: start.x,
          y: start.y,
          highlight: true,
          active: false,
        },
        end: {
          x: end.x,
          y: end.y,
          highlight: true,
          active: true,
        },
        textBox: {
          active: false,
          hasMoved: false,
          movesIndependently: false,
          drawnIndependently: true,
          allowedOutsideImage: true,
          hasBoundingBox: true,
        },
      },
    };

    // cornerstoneTools.clearToolState(element, 'RectangleRoi');
    // const toolData = cornerstoneTools.getToolState(element, 'rectangleRoi');
    // console.log(toolData)
    cornerstoneTools.addToolState(element, 'RectangleRoi', measurementData);
  }

  componentDidMount() {
    const input = document.getElementById('model-selection');
    var found = stateDetails.modelsDetails.filter(function(data) {
      return data.id === input.value;
    });
    const endpoint = `${found[0].infoApi}?model_id=${input.value}`;

    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        const value_params = data.data;

        this.setState({
          name: value_params.name,
          modality: value_params.modality,
          organ: value_params.organ,
          task: value_params.task,
          data_description: value_params.data_description,
          model_description: value_params.model_description,
          additional_info: value_params.additional_info,
          model_performance: value_params.model_performance,
          website: value_params.website,
          citation: value_params.citation,
          version: value_params.version,
        });
      });
  }

  render() {
    const optionItems = stateDetails.modelsDetails.map(
      ({ id, name, predictionApi, infoApi }) => (
        // eslint-disable-next-line react/jsx-key
        <option value={id}>{name}</option>
      )
    );

    return (
      <div id="ai-section-wrapper" className="">
        <form>
          <div className="form-group">
            <label className="form-label" htmlFor="ai-models">
              Available Models
            </label>
            <select
              id="model-selection"
              className="form-control ai-models js-aiModelName js-option"
              onChange={e => this.handleChange(e)}
            >
              {optionItems}
            </select>

            <div className="ai-magic-button">
              <button
                onClick={this.handlePredictionClick}
                className="btn btn-sm"
              >
                AI Magic
              </button>
            </div>
          </div>
        </form>
        <br />
        <p className="table-title">Model Specifications</p>
        <div id="ai-model-info">
          <table className="table table-responsive">
            <tbody>
              <tr>
                <td className="text-bold">model name</td>
                <td>{this.state.name}</td>
              </tr>
              <tr>
                <td className="text-bold">organ</td>
                <td>{this.state.organ}</td>
              </tr>
              <tr>
                <td className="text-bold">modality</td>
                <td>{this.state.modality}</td>
              </tr>
              <tr>
                <td className="text-bold">task</td>
                <td>{this.state.task}</td>
              </tr>
              <tr>
                <td className="text-bold">data description</td>
                <td>{this.state.data_description}</td>
              </tr>
              <tr>
                <td className="text-bold">model description</td>
                <td>{this.state.model_description}</td>
              </tr>
              <tr>
                <td className="text-bold">additional info required</td>
                <td>{this.state.additional_info}</td>
              </tr>
              <tr>
                <td className="text-bold">model performance</td>
                <td>{this.state.model_performance}</td>
              </tr>
              <tr>
                <td className="text-bold">website</td>
                <td>{this.state.website}</td>
              </tr>
              <tr>
                <td className="text-bold">citation</td>
                <td>{this.state.citation}</td>
              </tr>
              <tr>
                <td className="text-bold">version</td>
                <td>{this.state.version}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default AISection;
