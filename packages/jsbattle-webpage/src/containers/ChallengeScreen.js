import React from "react";
import {connect} from 'react-redux';
import LiveCode from '../components/LiveCode.js';
import {
  completeChallenge,
  getChallengeCode,
  getChallenge,
  updateChallengeCode,
} from '../actions/challengeAction.js';
import {
  notifyStatsChallengeComplete,
  notifyStatsChallengeOpen,
} from '../actions/statsAction.js';
import FullRow from '../components/FullRow.js';
import Loading from '../components/Loading.js';
import {Link} from 'react-router-dom';
import {getChallengeModifier} from "../services/challengeService.js";
import JsBattle from 'jsbattle-engine';

class ChallengeScreen extends React.Component {

  constructor(props) {
    super(props);

    this.battlefield = null;
    this.reloadTimeout = null;

    this.state = {
      code: props.code,
      tab: 'info',
      hasWon: false,
      loading: true,
      debug: {}
    };

    this._aiDefListTemplateCache = [];
    this._lastAiDefList = [];

    this.liveCode = React.createRef();
  }

  componentDidMount() {
    let challengeId = this.props.match.params.id;
    this.props.getChallengeCode(challengeId, this.props.useRemoteService);
    this.props.getChallenge(challengeId, this.props.useRemoteService);

    let currentChallenge = this.props.list.find((c) => c.id == challengeId);
    if(currentChallenge) {
      this.props.notifyStatsChallengeOpen(currentChallenge.level);
    }
  }

  restartBattle() {
    this.liveCode.current.restartBattle();
  }

  onCodeChanged(code) {
    console.log("Challenge code changed");
    this.props.updateChallengeCode(this.props.currentChallenge.id, code, this.props.useRemoteService);
  }

  onChallengeComplete(result) {
    let aliveTanks = result.tankList.filter((tank) => tank.energy > 0);
    if(aliveTanks.length != 1 || aliveTanks[0].name.toLowerCase() != 'player') {
      console.log("Challange lost... restarting");
      this.restartBattle();
      return;
    }
    console.log("Challange won");
    this.setState({hasWon: true});
    this.props.completeChallenge(this.props.currentChallenge.id, this.props.useRemoteService);
    this.props.notifyStatsChallengeComplete(this.props.currentChallenge.level);
  }

  getAiDefListTemplate() {
    if(JSON.stringify(this._lastAiDefList) == JSON.stringify(this.props.currentChallenge.aiDefList)) {
      return this._aiDefListTemplateCache;
    }
    let aiDefListTemplate = [];
    this._lastAiDefList = this.props.currentChallenge.aiDefList;
    this.props.currentChallenge.aiDefList.forEach((tank) => {
      let aiDef = JsBattle.createAiDefinition();
      switch(tank.source) {
        case 'file':
          aiDef.fromFile(tank.name);
          break;
        case 'code':
          aiDef.fromCode(tank.name, tank.code);
          break;
      }
      aiDefListTemplate.push(aiDef);
    });
    this._aiDefListTemplateCache = aiDefListTemplate;
    return aiDefListTemplate;
  }

  render() {
    if(this.props.isLoading) {
      return <Loading />;
    }
    if(!this.props.currentChallenge) {
      return <FullRow>
          <nav className="breadcrumb-container">
            <ol className="breadcrumb">
              <li style={{marginRight: '0.5em'}}><i className="fas fa-angle-right"></i></li>
              <li className="breadcrumb-item"><Link to="/challenge">Challenges</Link></li>
              <li className="breadcrumb-item" aria-current="page">Challenge unavailable</li>
            </ol>
          </nav>
        </FullRow>;
    }

    let congratsScreen = null;
    if(this.state.hasWon && this.props.isCompleting) {
      congratsScreen = <Loading />;
    } else if(this.state.hasWon) {
      congratsScreen = <div className="jumbotron text-center">
        <h4 className="congrats-msg result-msg"><i className="fas fa-trophy d-none d-lg-inline d-xl-inline"></i> Challenge Completed!</h4>
        <p className="d-none d-lg-block d-xl-block">Good job! You did it! Now try something more difficult - the next challenge is waiting for you.</p>
        <Link className="btn btn-primary btn-lg next-challenge" to="/challenge" role="button">
          Next Challenge
          &nbsp;
          <i className="fas fa-play"></i>
        </Link>
      </div>;
    }

    let modifier = getChallengeModifier(this.props.currentChallenge.id);

    return <div>
    <FullRow>
      <nav className="breadcrumb-container">
        <ol className="breadcrumb">
          <li style={{marginRight: '0.5em'}}><i className="fas fa-angle-right"></i></li>
          <li className="breadcrumb-item"><Link to="/challenge">Challenges</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Level {this.props.currentChallenge.level}: {this.props.currentChallenge.name}</li>
        </ol>
        <button type="button" className="btn btn-sm btn-primary restart-challenge-battle" onClick={() => this.restartBattle()}>
          <i className="fas fa-sync" aria-hidden="true"></i> Restart the Battle
        </button>
      </nav>
    </FullRow>
      <LiveCode
        ref={this.liveCode}
        challengeId={this.props.match.params.id}
        aiDefList={this.getAiDefListTemplate()}
        list={this.props.list}
        simQuality={this.props.simQuality}
        simSpeed={this.props.simSpeed}
        code={this.props.code}
        info={this.props.currentChallenge.description}
        onFinish={(result) => this.onChallengeComplete(result)}
        onCodeChanged={(code) => this.onCodeChanged(code)}
        rngSeed={this.props.currentChallenge.rngSeed}
        timeLimit={this.props.currentChallenge.timeLimit}
        teamMode={this.props.currentChallenge.teamMode}
        modifier={modifier}
      >
        {congratsScreen}
      </LiveCode>
    </div>;
  }
}

const mapStateToProps = (state) => ({
  list: state.challenge.list,
  simQuality: state.settings.simQuality,
  simSpeed: state.settings.simSpeed,
  currentChallenge: state.challenge.currentChallenge,
  isLoading: state.loading.CHALLENGE_CODE || state.loading.CHALLENGE,
  isCompleting: state.loading.COMPLETE_CHALLENGE,
  code: state.challenge.code,
  useRemoteService: state.auth.profile.registered
});

const mapDispatchToProps = (dispatch) => ({
  completeChallenge: (challengeId, useRemoteService) => {
    dispatch(completeChallenge(challengeId, useRemoteService));
  },
  getChallengeCode: (id, useRemoteService) => {
    dispatch(getChallengeCode(id, useRemoteService));
  },
  getChallenge: (id, useRemoteService) => {
    dispatch(getChallenge(id, useRemoteService));
  },
  updateChallengeCode: (id, code, useRemoteService) => {
    dispatch(updateChallengeCode(id, code, useRemoteService));
  },
  notifyStatsChallengeComplete: (levelId) => {
    dispatch(notifyStatsChallengeComplete(levelId));
  },
  notifyStatsChallengeOpen: (levelId) => {
    dispatch(notifyStatsChallengeOpen(levelId));
  },

});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChallengeScreen);
