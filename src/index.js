import REST from './REST'

export default class Logger
{
  constructor(config, devMode)
  {
    // { url, streamname, authentication, threshold }
    this.devMode = devMode
    this.logger = new REST(config, devMode);
  }

  send(options = {})
  {
    this.logger.send(options)
  }

  LogDebug(options = {})
  {
    let logger = this.logger
    options.level = logger.getDebugLevel()
    logger.send(options)
  }

  LogInfo(options = {})
  {
    let logger = this.logger
    options.level = logger.getInfoLevel()
    logger.send(options)
  }

  LogNotice(options = {})
  {
    let logger = this.logger
    options.level = logger.getNoticeLevel()
    logger.send(options)
  }

  LogWarning(options = {})
  {
    let logger = this.logger
    options.level = logger.getWarningLevel()
    logger.send(options)
  }

  LogError(options = {})
  {
    let logger = this.logger
    options.level = logger.getErrorLevel()
    logger.send(options)
  }

  LogCritical(options = {})
  {
    let logger = this.logger
    options.level = logger.getCriticalLevel()
    logger.send(options)
  }

  LogAlert(options = {})
  {
    let logger = this.logger
    options.level = logger.getAlertLevel()
    logger.send(options)
  }

  LogEmergency(options = {})
  {
    let logger = this.logger
    options.level = logger.getEmergencyLevel()
    logger.send(options)
  }

  logException(e, otherAdditionals = {})
  {
    let logger = this.logger
    try{
      e = JSON.parse(e)
    }
    catch(e){}

    let e_name = e.name || e.error || e.status
    let e_message = e.message || e.reason || e.statusText
    let e_stack = e.stack

    try{
      if (e.body) otherAdditionals.body = e.body
      if (e.headers) otherAdditionals.headers = e.headers
      if (e.status) otherAdditionals.status = e.status
      if (e.statusText) otherAdditionals.statusText = e.statusText
      if (e.type) otherAdditionals.type = e.type
      if (e.url) otherAdditionals.url = e.url
    }catch(e){}

    if (this.devMode === true) console.log('logException', e, otherAdditionals)

    if (typeof e.then === 'function') {
      // probably a promise
      Promise.resolve(e).then((results) => {
        if(results.ok !== 'undefined' && results.ok === false){
          if (this.devMode === true)
          {
            console.log(results);
          }
          e_name = results.status
          e_message = results.statusText
          e_stack = e_name + " - " + e_message + " - " + results.url
          otherAdditionals.body = results.body
          otherAdditionals.headers = results.headers
          otherAdditionals.status = results.status
          otherAdditionals.statusText = results.statusText
          otherAdditionals.type = results.type
          otherAdditionals.url = results.url

          let options = {
            short_message: e_name + " - " + e_message,
            full_message: typeof e_stack !== 'undefined' ? e_stack : e_message,
            facility: e_name,
            level: logger.getErrorLevel(),
            additionals: otherAdditionals ? _objectWithoutProperties(otherAdditionals, ['then', 'catch']) : null,
            then: otherAdditionals ? otherAdditionals.then : null,
            catch: otherAdditionals ? otherAdditionals.catch : null
          }
          logger.send(options)
        }
      });
    } else {
      // definitely not a promise
      let options = {
        short_message: e_name + " - " + e_message,
        full_message: typeof e_stack !== 'undefined' ? e_stack : e_message,
        facility: e_name,
        level: logger.getErrorLevel(),
        additionals: otherAdditionals ? _objectWithoutProperties(otherAdditionals, ['then', 'catch']) : null,
        then: otherAdditionals ? otherAdditionals.then : null,
        catch: otherAdditionals ? otherAdditionals.catch : null
      }
      logger.send(options)
    }
  }
}

function _objectWithoutProperties(obj, keys) {
  var target = {};
  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }
  return target;
}
