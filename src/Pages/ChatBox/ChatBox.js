import React from 'react';
import {Card} from 'react-bootstrap';
import ReactLoading from 'react-loading';
import 'react-toastify/dist/ReactToastify.css';
import firebase from '../../Services/firebase';
import Images from '../../ProjectImages/ProjectImages';
import moment from 'react-moment';
import './ChatBox.css';
import LoginString from '../Login/LoginStrings';
import 'bootstrap/dist/css/bootstrap.min.css';

export default class ChatBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading : false,
            isShowSticker : false,
            inputValue : ""
        }
        this.currentUserName=localStorage.getItem(LoginString.Name)
        this.currentUserId=localStorage.getItem(LoginString.ID)
        this.currentUserPhoto=localStorage.getItem(LoginString.PhotoURL)
        this.currentUserDocumentId=localStorage.getItem(LoginString.FirebaseDocumentId)
        this.stateChanged = localStorage.getItem(LoginString.UPLOAD_CHANGED)
        this.currentPeerUser = this.props.currentPeerUser

        this.listMessage = [];
        this.groupChatId = null;
        this.currentPeerUserMessages = [];
        this.removeListener = null;
        this.currentPhotoFile = null;

        firebase.firestore().collection('users').doc(this.currentPeerUser.documentKey).get()
        .then((docRef) => {
            this.currentPeerUserMessages = docRef.data().messages
        })
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    componentWillReceiveProps(newProps) {
        if(newProps.currentPeerUser) {
            this.currentPeerUser = newProps.currentPeerUser
            this.getListHistory()
        }
    }

    getListHistory = () => {
      console.log("Get history");
        if(this.removeListener) {
            this.removeListener();
        }
        this.listMessage.length = 0;
        this.setState({isLoading : true});
        if(this.hashString((this.currentUserId).toString()) <= this.hashString((this.currentPeerUser.id).toString())) {
            this.groupChatId = `${this.currentUserId}-${this.currentPeerUser.id}`;
        }
        else {
            this.groupChatId = `${this.currentPeerUser.id}-${this.currentUserId}`;
        }

        this.removeListener = (firebase.firestore()
        .collection('Messages')
        .doc(this.groupChatId)
        .collection(this.groupChatId)
        .onSnapshot(
            snapshot => {
            snapshot.docChanges().forEach(change => {
                if(change.type === LoginString.DOC) {
                    this.listMessage.push(change.doc.data())
                }
            })
            this.setState({isLoading : false})
        }),
        err => {
            this.props.showToast(0, err)
        })
    }


    componentDidMount() {
        this.getListHistory();
    }

    componentWillUnmount() {
        if(this.removeListener) {
            this.removeListener();
        }
    }

    onSendMessage = (content, type) => {
        console.log("onSendMessage :", this.groupChatId);
        let notificationMessages = []
        if(this.state.isShowSticker && type === 2) {
            this.setState({isShowSticker : false})
        }
        if(content.trim() === '') {
            return
        }
        const timestamp =  Date.now().toString().valueOf().toString();
        const itemMessage = {
            idFrom : this.currentUserId,
            idTo : this.currentPeerUser.id,
            timestamp : timestamp,
            content : content.trim(),
            type : type
        }
        firebase.firestore()
        .collection('Messages')
        .doc(this.groupChatId)
        .collection(this.groupChatId)
        .doc(timestamp)
        .set(itemMessage)
        .then(() => {
            this.setState({inputValue : ''})
        })
        this.currentPeerUserMessages.map((item) => {
            if(item.notificationId !== this.currentUserId) {
                notificationMessages.push(
                    {
                        notificationId : item.notificationId,
                        number : item.number
                    }
                )
            }
        })
        firebase.firestore()
        .collection('users')
        .doc(this.currentPeerUser.documentKey)
        .update({
            messages : notificationMessages
        })
        .then((data) => {})
        .catch(err => {
            this.props.showToast(0, err.toString())
        })
    }

    scrollToBottom = () => {
        if(this.messagesEnd) {
            this.messagesEnd.scrollIntoView({})
        }
    }

    onKeyPress = event => {
        if(event.key === 'Enter') {
            this.onSendMessage(this.state.inputValue, 0)
        }
    }

    openListSticker = () => {
        this.setState({isShowSticker : !this.state.isShowSticker})
    }

    render() {
        return (
            <Card className = "viewChatBoard">
                <div className = "headerChatBoard">
                    <img
                    className = "viewAvatarItem"
                    src = {this.currentPeerUser.URL}
                    alt = ""
                    />
                    <span className = "textHeaderChatBoard">
                        <p style = {{fontSize : '20px', paddingTop : '11px'}}>{this.currentPeerUser.name}</p>
                    </span>
                    <div className = "aboutMe">
                        <span>
                            <p style = {{paddingLeft : '20px', paddingTop : '15px'}}>{this.currentPeerUser.description}</p>
                        </span>
                    </div>
                    </div>
                    <div className = "viewListContentChat">
                        {this.renderListMessage()}
                        <div
                        style = {{float : 'left', clear : 'both'}} 
                        ref = {el => {
                            this.messagesEnd = el
                        }}
                        />
                    </div>
                    {this.state.isShowSticker ? this.renderStickers() : null}
                    <div className = "viewBottom">
                        <img
                            className = "icOpenGallery"
                            src = {Images.input_file}
                            alt = "input_file"
                            onClick = {() => {this.refInput.click()}}
                        />
                        <input
                        ref = { el => {
                            this.refInput = el
                        }}
                        className = "viewInputGallery"
                        accept = "image/*"
                        type = "file"
                        onChange = {this.onChoosePhoto}
                        />
                        <img
                        className = "icOpenSticker"
                        src = {Images.sticker}
                        alt = "icon open sticker"
                        onClick = {this.openListSticker}
                        />
                        <input className = "viewInput"
                        placeholder = "Type a message"
                        value = {this.state.inputValue}
                        onChange = {event =>{
                            this.setState({inputValue : event.target.value})
                        }}
                        onKeyPress = {this.onKeyPress}
                        />
                        <img
                        className = "icSend"
                        src = {Images.send}
                        alt = "icon send"
                        onClick = {() => {this.onSendMessage(this.state.inputValue, 0)}}
                        />
                        {console.log("Value :", this.state.inputValue)}
                    </div>
                    {this.state.isLoading ? (
                        <div className = "viewLoading">
                            <ReactLoading
                                type = {'spin'}
                                color = {'#203152'}
                                height = {'3%'}
                                width = {'3%'}
                            />
                        </div>
                    ) : null }
            </Card>
        )
    }

    onChoosePhoto = event => {
        if(event.target.files && event.target.files[0]) {
            this.setState({isLoading : true})
            this.currentPhotoFile = event.target.files[0]
            const prefixFiletype = event.target.files[0].type.toString()
            if(prefixFiletype.indexOf('image/') === 0) {
                this.uploadPhoto()
            } else {
                this.setState({isLoading : false})
                this.props.showToast(0, 'This file is not an image')
            }
        } else {
            this.setState({isLoading : false})
        }
    }

    uploadPhoto = () => {
        if(this.currentPhotoFile) {
            const timestamp =  Date.now().toString().valueOf().toString();
            const uploadTask = firebase.storage()
            .ref()
            .child(timestamp)
            .put(this.currentPhotoFile)

            uploadTask.on(
                LoginString.UPLOAD_CHANGED,
                null,
                err => {
                    this.setState({isLoading : false})
                    this.props.showToast(0, err.message)
                },
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                        this.setState({isLoading : false})
                        this.onSendMessage(downloadURL, 1)
                    })
                }
            )
        } else {
            this.setState({isLoading : false})
            this.props.showToast(0, 'File is null')
        }
    }

    renderListMessage = () => {
        if(this.listMessage.length > 0) {
            let viewListMessage = []
            this.listMessage.forEach((item, index) => {
                if(item.idFrom === this.currentUserId) {
                    if(item.type === 0) {
                        viewListMessage.push(
                            <div className = "viewItemRight" key = {item.timestamp}>
                                <span className = "textContentItem">{item.content}</span>
                            </div>
                        )
                    }
                    else if(item.type === 1) {
                        viewListMessage.push(
                            <div className = "viewItemRight2" key = {item.timestamp}>
                                <img
                                    className = "imgItemRight"
                                    src = {item.content}
                                    alt = ""
                                />
                            </div>
                        )
                    }
                    else {
                        viewListMessage.push(
                            <div className = "viewItemRight3" key = {item.timestamp}>
                                <img
                                    className = "imgItemRight"
                                    src = {this.getGifImage(item.content)}
                                    alt = "content message"
                                />
                            </div>
                        )
                    }
                }
                else {
                    if(item.type === 0) {
                      viewListMessage.push(
                            <div className = "viewWrapItemLeft" key = {item.timestamp}>
                                <div className = "viewWrapItemLeft3">
                                    {this.isLastMessageLeft(index) ? (
                                        <img
                                        // src = {this.currentPeerUser.URL}
                                        alt = ""
                                        className = "peerAvatarLeft"
                                    />
                                    ) : (
                                        <div className = "viewPaddingLeft"/>
                                    )}
                                    <div className = "viewItemLeft">
                                        <span className = "textContentItem">{item.content}</span>
                                    </div>
                                </div>
                                {this.isLastMessageLeft(index) ? (
                                    <span className = "textTimeLeft">
                                        <div className = "time">
                                            {/* {moment(Number(item.timestamp)).format('ll')} */}
                                        </div>
                                    </span>
                                ): null}
                            </div>
                        )
                    } else if(item.type === 1) {
                      viewListMessage.push(
                            <div className = "viewWrapItemLeft2" key = {item.timestamp}>
                                <div className = "viewWrapItemLeft3">
                                    {this.isLastMessageLeft(index) ? (
                                      <img
                                        // src = {this.currentPeerUser.URL}
                                        alt = ""
                                        className = "peerAvatarLeft"
                                      />
                                    ) : (
                                        <div className = "viewPaddingLeft"/>
                                    )}
                                    <div className = "viewItemLeft2">
                                        <img
                                            src = {item.content}
                                            alt = "content message"
                                            className = "imgItemLeft"
                                        />
                                    </div>
                                </div>
                                {this.isLastMessageLeft(index) ? (
                                    <span className = "textTimeLeft">
                                        <div className = "time">
                                            {/* {moment(Number(item.timestamp)).format('ll')} */}
                                        </div>
                                    </span>
                                ): null}
                            </div>
                        )
                    } else {
                      viewListMessage.push(
                            <div className = "viewWrapItemLeft2" key = {item.timestamp}>
                                <div className = "viewWrapItemLeft3">
                                    {this.isLastMessageLeft(index) ? (
                                        <img
                                        // src = {this.currentPeerUser.URL}
                                        alt = ""
                                        className = "perrAvatarLeft"
                                    />
                                    ) : (
                                        <div className = "viewPaddingLeft"/>
                                    )}
                                    <div className = "viewItemLeft3" key = {item.timestamp}>
                                        <img
                                          className = "imgItemRight"
                                          src = {this.getGifImage(item.content)}
                                          alt = "content message"
                                        />
                                    </div>
                                </div>
                                {this.isLastMessageLeft(index) ? (
                                    <span className = "textTimeLeft">
                                        <div className = "time">
                                            {/* {moment(Number(item.timestamp)).format('ll')} */}
                                        </div>
                                    </span>
                                ): null}
                            </div>
                        )
                    }
                }
            }) 
            return viewListMessage
        } else {
            return (
            <div className = "viewWrapSayHi">
                <h1 className = "textSayHi">Say Hi to new friend</h1>
                <img
                    className = "imgWaveHand"
                    src = {Images.wave_hand}
                    alt = "wave hand"
                />
            </div>
            )
        }
    }

    renderStickers = () => {
        return(
            <div className = "viewStickers">
                <img
                className = "imgSticker"
                src = {Images.lego1}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego1', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego2}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego2', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego3}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego3', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego4}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego4', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego5}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego5', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego6}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego6', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego7}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego7', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego8}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego8', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego9}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego9', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego10}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego10', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego11}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego11', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego12}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego12', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego13}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego13', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego14}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego14', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego15}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego15', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego16}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego16', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego17}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego17', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego18}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego18', 2)}}
                />
                <img
                className = "imgSticker"
                src = {Images.lego19}
                alt = "sticker"
                onClick = {() => {this.onSendMessage('lego19', 2)}}
                />
            </div>
        )
    }

    getGifImage = value => {
        switch(value) {
            case 'lego1' :
                return Images.lego1
            case 'lego2' :
                return Images.lego2
            case 'lego3' :
                return Images.lego3
            case 'lego4' :
                return Images.lego4
            case 'lego5' :
                return Images.lego5
            case 'lego6' :
                return Images.lego6
            case 'lego7' :
                return Images.lego7
            case 'lego8' :
                return Images.lego8
            case 'lego9' :
                return Images.lego9
            case 'lego10' :
                return Images.lego10
            case 'lego11' :
                return Images.lego11
            case 'lego12' :
                return Images.lego12
            case 'lego13' :
                return Images.lego13
            case 'lego14' :
                return Images.lego14
            case 'lego15' :
                return Images.lego15
            case 'lego16' :
                return Images.lego16
            case 'lego17' :
                return Images.lego17
            case 'lego18' :
                return Images.lego18
            case 'lego19' :
                return Images.lego19
        }
    }

    hashString = str => {
        let hash = 0;
        for(let i = 0; i < str.length; i++) {
            hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
            hash = (hash & hash);
        }
        console.log("hashString :", str, hash);
        return hash;
    }
    isLastMessageLeft(index) {
        if((index + 1 < this.listMessage.length && this.listMessage[index + 1].idFrom === this.currentUserId) || index === this. listMessage.length - 1)
        {
            return true
        }
        else
        {
            return false
        }
    }
    isLastMessageRight(index) {
        if((index + 1 < this.listMessage.length && this.listMessage[index + 1].idFrom !== this.currentUserId)|| index === this.listMessage.length - 1) {
            return true
        }
        else
        {
            return false
        }
    }
}