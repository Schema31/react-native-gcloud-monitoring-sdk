const EMERGENCY = 0;
const ALERT = 1;
const CRITICAL = 2;
const ERROR = 3;
const WARNING = 4;
const NOTICE = 5;
const INFO = 6;
const DEBUG = 7;
const URL = "https://adaptor.monitoring.gcloud.schema31.it/Adaptor/listener/REST"

import * as DeviceInfo from 'react-native-device-info'

/**
* Classe che serve per scriver un REST Log (unico protocollo supportato è il REST)
*/
export default class REST {

  /**
  *
  * @param {streamname, authentication, threshold} options streamname è il nome del flusso
  * authentication la chiave di autenticazione, threshold la soglia minima di importanza per
  * scrivere o meno un  REST
  */
  constructor(options = {}, devMode)
  {
    this.devMode = devMode

    if (options)
    {
      if(options.streamname && options.streamname.length != 0)
      {
        this.host = options.streamname
      }

      if(options.authentication && options.authentication.length != 0)
      {
        this._AuthKey = options.authentication
      }

      this.threshold = options.threshold ? parseInt(options.threshold) : DEBUG
      this.url = options.url && options.url.length != 0 ? options.url : URL
    }
    else
    {
      this.url = URL
      this.threshold = DEBUG
    }

    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }

  getDebugLevel(){
    return DEBUG;
  }

  getInfoLevel(){
    return INFO;
  }

  getNoticeLevel(){
    return NOTICE;
  }

  getWarningLevel(){
    return WARNING;
  }

  getErrorLevel(){
    return ERROR;
  }

  getCriticalLevel(){
    return CRITICAL;
  }

  getAlertLevel(){
    return ALERT;
  }

  getEmergencyLevel(){
    return EMERGENCY;
  }

  getDeviceInfo()
  {
    return {
      DeviceUniqueId: DeviceInfo.getUniqueId(),
      ApplicationName: DeviceInfo.getApplicationName(),
      DeviceBrand: DeviceInfo.getBrand(),
      DeviceBuildNumber: DeviceInfo.getBuildNumber(),
      DeviceId: DeviceInfo.getDeviceId(),
      DeviceType: DeviceInfo.getDeviceType(),
      DeviceModel: DeviceInfo.getModel(),
      DeviceSystemName: DeviceInfo.getSystemName(),
      DeviceSystemVersion: DeviceInfo.getSystemVersion(),
      ApplicationVersion: DeviceInfo.getVersion(),
      DeviceIsTablet: DeviceInfo.isTablet(),
      DeviceHasNotch: DeviceInfo.hasNotch()
    }
  }

  /**
  *
  * @param {short_message, full_message, facility, level, file, line, additionals} options short_message è il titolo del Messaggio
  * full_message il corpo del Messaggio, facility è la scorciatoia per identificare un gruppo di Messaggi, level è uno tra
  * const EMERGENCY|ALERT|CRITICAL|ERROR|WARNING|NOTICE|INFO|DEBUG, file è il nome o percorso del file che genera il Messaggio,
  * line è la linea che genera il Messaggio, additionals è un oggetto formato chiave=>valore per aggiungere delle
  * informazioni supplementari al Messaggio
  */
  send(options = {})
  {
    if (!this.host || !this._AuthKey || !this.url)
    {
      console.error('Unable to send LOG stream')
      if (options.catch && typeof options.catch === 'function')
      {
        options.catch({
          error: 'unable_to_send_log',
          message: 'Unable to send LOG stream, missing one or all mandatory parameters (host, Authkey or url)'
        })
      }
      return
    }

    const body = {
      host: this.host,
      _AuthKey: this._AuthKey,
      ...this.getDeviceInfo()
    };

    if(options.hasOwnProperty('full_message') && this.is_string_full(options.full_message))
    {
      body.full_message = encodeURI(options.full_message)
    }

    if(options.hasOwnProperty('facility') && this.is_string_full(options.facility))
    {
      body.facility = encodeURI(options.facility)
    }

    if(options.hasOwnProperty('level') && this.is_int(options.level))
    {
      body.level = Number(options.level)
    }
    else body.level = DEBUG

    if(options.hasOwnProperty('short_message') && this.is_string_full(options.short_message))
    {
      body.short_message = encodeURI(options.short_message)
    }
    else
    {
      switch(Number(body.level))
      {
        case EMERGENCY:
        case ALERT:
        case CRITICAL:
        case ERROR:
        body.short_message = 'error'
        break;

        case WARNING:
        body.short_message = 'warning'
        break;

        case NOTICE:
        body.short_message = 'notice'
        break;

        case INFO:
        body.short_message = 'info'
        break;

        default:
        body.short_message = 'debug'
        break;
      }
    }

    if(options.hasOwnProperty('file') && this.is_string_full(options.file))
    {
      body.file = encodeURI(options.file)
    }

    if(options.hasOwnProperty('line') && this.is_int(options.line))
    {
      body.line = options.line
    }

    if(options.additionals)
    {
      const self = this
      Object.keys(options.additionals).forEach(function(key) {
        if(self.is_string_full(key)){
          try{
            body["_"+key] = self.is_string_full(options.additionals[key]) ? encodeURI(options.additionals[key]) : JSON.stringify(options.additionals[key]);
          }catch(e){}
        }
      });
    }

    if(this.threshold < body.level)
    {
      console.error('Unable to send LOG stream', `threshold: ${this.threshold}`, `level: ${body.level}`)
      if (options.catch && typeof options.catch === 'function') options.catch({
        error: 'unable_to_send_log',
        message: `Unable to send LOG stream, body.level excedes the allowed threshold: threshold: ${this.threshold}, level: ${body.level}`
      })
      return
    }

    const searchParams = new URLSearchParams();
    Object.keys(body).forEach(key => searchParams.append(key, body[key]));

    fetch(this.url, {
      method: 'POST',
      body: searchParams.toString(),
      headers: this.headers
    })
    .then(response => {
      if (response.error || !response.ok)
      {
        throw (response)
      }
      if (this.devMode) console.log('LOG successfully sent', this.host)

      if (options.then && typeof options.then === 'function') options.then(response)
    })
    .catch(error => {
      console.error('There was an error on LOG writing', error)
      if (options.catch && typeof options.catch === 'function') options.catch(error)
    });
  }

  is_string(input){
    return input && (typeof input == 'string' || input instanceof String)
  }

  is_string_full(input){
    return this.is_string(input) && input.length != 0;
  }

  is_int(input) {
    if (isNaN(input)) {
      return false;
    }
    var x = parseFloat(input);
    return (x | 0) === x;
  }
}
