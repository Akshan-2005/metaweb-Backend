require("dotenv").config();

const express = require( "express");
const http  = require("http");
const app = express();
const { Resend } =    require("resend");
var cors = require("cors");

app.use(express.json());
app.use(cors());
const server = http.createServer(app);
const resend = new Resend(process.env.RESEND_API_KEY);
console.log(process.env.RESEND_API_KEY);


app.post("/sendemail",async(req,res)=>{
    console.log("got request");
    // const senderEmail = req.body.senderEmail;
    const email = req.body.email ;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phone = req.body.phone;
    const org = req.body.org;
    const help = req.body.help;
    // const {firstName, lastName,email,phone,org,help} = req.body;

try{
    const sentEmail = await sendEmail(firstName, lastName,email,phone,org,help);
    if(sentEmail==1){
        res.json({
            message:"email sent",
        }).status(200);
    }else {
        res.json({
            error:sentEmail
        })
    }
}catch(err){
    console.log(error);
    console.log("encountered error");
}
    

});
const sendEmail = async (firstName, lastName,email,phone,org,help) => {

  let data;
  try {
    data = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: "akshanaggarwal20@gmail.com",
      subject: "Message from contact form",
      reply_to: email,
      html: `
      <div>
        <div><span><strong>First Name:</strong></span> <span>${firstName}</span></div>
        <div><span><strong>Last Name:</strong></span> <span>${lastName}</span></div>
        <div><span><strong>Email:</strong></span> <span>${email}</span></div>
        <div><span><strong>Phone:</strong></span> <span>${phone}</span></div>
        <div><span><strong>Organization:</strong></span> <span>${org}</span></div>
        <div><span><strong>Help Request:</strong></span> <span>${help}</span></div>
      </div>
      `

      
    });
    console.log(data);
    console.log("message sent");
   return 1;
    
  } catch (error) {
    return {
      error: error,
    };
  }

};
const PORT = 3001;
server.listen(PORT,()=>{
    console.log("app started at port " + PORT);
})