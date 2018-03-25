import moment from 'moment';
const calUtils = {

  selectRange: function (slot) {
    if (this.state.eventRow) {
      this.state.initEventRow = this.state.eventRow.slice();
    }
    if (this.props.user.id) {
      //SLOT IS DATE OBJ
      if (this.props.user.type !== 'admin' && slot.slots.length > 4) {
        //change to something prettier
        alert('Please select a time range of 2 hours or less')
      } else if (this.props.user.hasEvent && this.props.user.type !== 'admin') {
        alert('You already have an event scheduled.\nPlease wait for this event to expire, or reschedule it');
      } else {
        let start = moment(slot.start);
        let end = moment(slot.end);
        if (this.state.eventRow) {  
          var fill = this.fillTimeSlot(start, end);
        }
        if (this.state.eventRow && !fill) {
          alert('Please select a valid time');
        } else {
          this.setState({
            selectedStart: start,
            selectedEnd: end
          }, () => {
            $(`#${this.state.roomname}Modal`).modal('show')
          })
        }
      }
    }
    else {
      //change to something prettier
      alert('Please log in');
    }
  },

  createEvent: function () {
    const event = {
      title: this.state.purpose,
      start: this.state.selectedStart,
      end: this.state.selectedEnd,
      UserId: this.props.user.id, //grab this from state generated by auth
      room: this.props.room ? this.props.room.name : this.state.selectedRoom.name
    }
    console.log('GENERATED EVENT AS', event)
    try {
      this.props.postEvent(event, this.props.roomNo);
      this.props.refreshUser(this.props.user.id);
      if (this.props.room){
        this.setState({
          // eventsList: this.state.eventsList.concat(event),
          initEventRow: this.state.eventRow.slice(),
          // eventsUpdated: false,
        })
      }
      if (this.props.user.type !== 'admin') {
        this.state.eventCreated = true;
      }
    } catch (e) {
      alert('Time range invalid and overlapping existing events.');
    }
  },

  handlePurposeChange: function (e) {
    this.setState({
      purpose: e.target.value
    });
  },

  handleStartChange: function (e) {
    let newStart = moment(`${e.target.value} ${this.state.selectedStartAmPm}`, 'hh:mm a');
    if (this.state.selectedEnd - newStart <= 0 || newStart.hours() < 8) {
      this.state.timeError = true;
    } else {
      this.state.timeError = false;
    }
    if (e.target.value === '') {
      newStart = moment(this.state.selectedEvent.start);
    }

    this.setState({
      selectedStart: newStart,
    })
  },

  handleEndChange: function (e) {
    let newEnd = moment(`${e.target.value} ${this.state.selectedEndAmPm}`, 'hh:mm a');
    if (this.state.selectedStart - newEnd >= 0 || newEnd.hours() > 20 || (newEnd.hours() === 20 && newEnd.minutes() > 0)) {
      this.state.timeError = true;
    } else {
      this.state.timeError = false;
    }
    if (e.target.value === '') {
      newEnd = moment(this.state.selectedEvent.end);
    }

    this.setState({
      selectedEnd: newEnd
    })
  },

  handleStartAmPmChange: function (e) {
    let newStart = moment(`${this.state.selectedStart.format('hh:mm')} ${e.target.value}`, 'hh:mm a');
    if (this.state.selectedEnd - newStart <= 0 || newStart.hours() < 8) {
      this.state.timeError = true;
    } else {
      this.state.timeError = false;
    }
    this.setState({
      selectedStartAmPm: e.target.value,
      selectedStart: newStart
    })
  },

  handleEndAmPmChange: function (e) {
    let newEnd = moment(`${this.state.selectedEnd.format('hh:mm')} ${e.target.value}`, 'hh:mm a');
    if (this.state.selectedStart - newEnd >= 0 || newEnd.hours() > 20 || (newEnd.hours() === 20 && newEnd.minutes() > 0)) {
      this.state.timeError = true;
    } else {
      this.state.timeError = false;
    }
    this.setState({
      selectedEndAmPm: e.target.value,
      selectedEnd: newEnd
    })
  },

  resetEventsRow: function () {
    this.setState({
      eventRow: this.state.initEventRow.slice()
    });
  },

  editEvent: function (selectedEvent) {
    console.log('selecao', selectedEvent)
    if (this.props.user.id === selectedEvent.UserId || this.props.user.type === 'admin') {
      this.setState({
        selectedEvent: selectedEvent,
        purpose: selectedEvent.title,
        selectedStartAmPm: moment(selectedEvent.start).format('a'),
        selectedEndAmPm: moment(selectedEvent.end).format('a'),
        selectedStart: moment(selectedEvent.start),
        selectedEnd: moment(selectedEvent.end),
      }, () => {
        $(`#${this.state.roomname}EditModal`).modal('show')
      })
    }
  },

  saveChanges: function () {
    let originalEvent = Object.assign({}, this.state.selectedEvent);

    let newEvent = this.state.selectedEvent;
    newEvent.start = this.concatTimeMeridiem(this.state.selectedStart, this.state.selectedStartAmPm).toDate();
    newEvent.end = this.concatTimeMeridiem(this.state.selectedEnd, this.state.selectedEndAmPm).toDate();
    newEvent.title = this.state.purpose;

    //checks length of event Kan wants this gone
    if (this.props.user.type !== 'admin') {
      let diffTime = this.state.selectedEvent.end.getTime() - this.state.selectedEvent.start.getTime();
      if (diffTime > 7200000) {
        alert('Please select a time range of 2 hours or less');
        this.state.selectedEvent.start = originalEvent.start;
        this.state.selectedEvent.end = originalEvent.end;
        this.setState({
          selectedEvent: originalEvent
        });
        return;
      }
    }
    this.props.updateEvent(newEvent);
  },

  removeEvent: function () {
    console.log('this', this);
    this.props.deleteEvent(this.state.selectedEvent);
    this.setState({
      selectedEvent: { start: moment(), end: moment() }
    })
  },

  formatTime: function (time) {
    return moment(time).format('hh:mm');
  },

  concatTimeMeridiem(time, meridiem) {
    let year = this.props.currDate.year();
    let month = this.props.currDate.month() + 1;
    let day = this.props.currDate.date();
    return moment(`${year}-${month}-${day} ${time.hour()}:${time.minute()} ${meridiem} `, 'YYYY-MM-DD hh:mm a ');
  },

  title(event) {
    return `${event.desc} - ${event.title}`;
  }

}

export default calUtils;