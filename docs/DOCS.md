# CUNY Blackboard API (WIP)

Contact: [kartikk221](https://github.com/kartikk221) | URL: [https://github.com/kartikk221/cuny-blackboard-api](https://github.com/kartikk221/cuny-blackboard-api) | Licence: [MIT](https://mit-license.org/)

CUNY Blackboard API is an API that provides an interface to the CUNY Blackboard application. Some of the features that are currently available
are view user details, view assignments, and view annoucements.

# Routes

<div>
  <h2>Login</h2>
  <hr/>
  <div class="section">
    <h3>Log into blackboard</h3>
    <div class="mtd_url">
      <h3>POST</h3>
      <h4>/login</h4>
    </div>
    <div class="rq_body">
    <h3><b><i>REQUEST BODY SCHEMA: application/json</i></b></h3>
    <pre>{
  username: string,
  password: string
}</pre>
    </div>
    <div>
      <h3><i><b>Responses</i></b></h3>
      <div>
        <h4><b>400</b> INVALID_CREDENTIALS</h4>
        <pre>{
  code: "NVALID_CREDENTIALS",
  message: string
}</pre>
        <h4><b>200</b> OK</h4>
        <pre>{
  token: string,
  age: number,
  expires_at: numberr
}</pre>
      </div>
    </div>
  </div>
</div>

<style>
  .section {
    margin-top: 50px;
  }

  .mtd_url {
    display: flex;
    flex-direction: row;
    background-color: gray;
    height: 40px;
  }

  .mtd_url h3 {
    height: 27px;
    width: 47px;
    margin: 0px;
    margin-right: 30px;
    margin-left: 30px;
    padding-left: 5px;
    background-color: orange;
    margin-top: 6px;
  }

  .mtd_url h4 {
    padding-top: 6px;
  }

  .rq_body {
    margin-top: 20px
  }
</style>
