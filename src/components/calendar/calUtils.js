import moment from 'moment';
const calUtils = {

  selectRange: function (slot) {
    console.log('HERE IS THE SLOT', slot)
    if (this.state.eventRow) {
      this.state.initEventRow = this.state.eventRow.slice();
    }
    if (this.props.user.id) {
      //SLOT IS DATE OBJ
      // if (this.props.user.type !== 'admin' && slot.slots.length > 4) {
      //   //alerts if student group is making an event longer than 2 hours
      //   alert('Please select a time range of 2 hours or less')
      if (this.props.user.type !== 'admin') {
        const currentDate = new Date();
        const slotDate = slot.start;
        if (currentDate.getUTCDate() !== slotDate.getUTCDate() || currentDate.getUTCMonth() !== slotDate.getUTCMonth() || currentDate.getUTCFullYear() !== slotDate.getUTCFullYear()) {
          alert(`You may only create events on the current date ${currentDate.getDate()}/ ${currentDate.getMonth()}/ ${currentDate.getFullYear()}`);
          return;
        }

        if (this.props.user.hasEvent) {
          alert('You already have an event scheduled.\nPlease wait for this event to expire, or reschedule it');
          return;
        }

        let start = moment(slot.start);
        let end = moment(slot.end);
        if (this.state.eventRow) {
          var fill = this.fillTimeSlot(slot.start, slot.end);
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
      this.props.postAndRefresh(event, this.props.socket);
      // this.props.refreshUser(this.props.user.id);
      if (this.props.room) {
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
    let newStart = moment(`${this.state.selectedDate} ${e.target.value} ${this.state.selectedStartAmPm}`, 'MM-DD-YYYY hh:mm a');
    console.log('HERE IS THE NEW START', newStart, 'AND HERE IS THE DATE', this.state.selectedDate)
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
    let newEnd = moment(`${this.state.selectedDate} ${e.target.value} ${this.state.selectedEndAmPm}`, 'MM-DD-YYYY hh:mm a');
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
    let newStart = moment(`${this.state.selectedDate} ${this.state.selectedStart.format('hh:mm')} ${e.target.value}`, 'MM-DD-YYYY hh:mm a');
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
    let newEnd = moment(`${this.state.selectedDate} ${this.state.selectedEnd.format('hh:mm')} ${e.target.value}`, 'MM-DD-YYYY hh:mm a');
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
        selectedDate: moment(selectedEvent.start).format('MM-DD-YYYY')
      }, () => {
        $(`#${this.state.roomname}EditModal`).modal('show')
      })
    }
  },

  saveChanges: function () {
    let newEvent = Object.assign({}, this.state.selectedEvent);
    newEvent.start = this.concatTimeMeridiem(this.state.selectedStart, this.state.selectedStartAmPm, this.state.selectedDate).toDate();
    newEvent.end = this.concatTimeMeridiem(this.state.selectedEnd, this.state.selectedEndAmPm, this.state.selectedDate).toDate();
    newEvent.title = this.state.purpose;

    //checks length of event to not exceed 2 hours for student groups
    // if (this.props.user.type !== 'admin') {
    //   let diffTime = this.state.selectedEvent.end.getTime() - this.state.selectedEvent.start.getTime();
    //   if (diffTime > 7200000) {
    //     alert('Please select a time range of 2 hours or less');
    //     this.state.selectedEvent.start = originalEvent.start;
    //     this.state.selectedEvent.end = originalEvent.end;
    //     this.setState({
    //       selectedEvent: originalEvent
    //     });
    //     return;
    //   }
    // }

    this.props.updateAndRefresh(newEvent, this.props.socket)
  },

  removeEvent: function () {
    console.log('this', this);
    this.props.deleteAndRefresh(this.state.selectedEvent, this.props.socket);
    this.setState({
      selectedEvent: { start: moment(), end: moment() }
    })
  },

  formatTime: function (time) {
    return moment(time).format('hh:mm');
  },

  concatTimeMeridiem(time, meridiem, date) {
    let year = this.props.currDate.year();
    let month = this.props.currDate.month() + 1;
    let day = this.props.currDate.date();
    return moment(`${date} ${time.hour()}:${time.minute()} ${meridiem} `, 'MM-DD-YYYY hh:mm a ');
  },

  title(event) {
    return `${event.desc} - ${event.title}`;
  }

}

export default calUtils;