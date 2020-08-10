import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './Welcome.css';

export default class WelcomeCard extends React.Component {
    render() {
        return (
            <div className = "viewWelcomeBoard">
                <img
                    className = "avatarWelcome"
                    src = {this.props.currentUserPhoto}
                    alt = ""
                />
                <h1 className = "textTileWelcome">{`Welcome, ${this.props.currentUserName}`}</h1>
                <span className = "textDescriptionWelcome">
                    Let's connect the World!
                </span>
            </div>
        )
    }
}