"use client";
import {Component,type ReactNode} from "react";
import {reportPanelCrash} from "./client-crash-report";
export class PanelErrorBoundary extends Component<{panel:string;action?:string;resetKey?:string;visible?:boolean;children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  componentDidCatch(error:Error){reportPanelCrash(this.props.panel,this.props.action??"render",error);}
  componentDidUpdate(previous:Readonly<typeof this.props>){
    if(this.state.failed&&previous.resetKey!==this.props.resetKey)this.setState({failed:false});
  }
  render(){
    if(!this.state.failed)return this.props.children;
    if(this.props.visible===false)return null;
    return <section className="notice" role="alert" aria-label={`${this.props.panel} unavailable`}>
      <p>This panel could not display. Your saved work has not been removed.</p>
      <button type="button" className="secondary small" onClick={()=>this.setState({failed:false})}>Try again</button>
    </section>;
  }
}
