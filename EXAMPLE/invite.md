POST /api/invites

Creates invite.

Input:

{
  email: string,
  role: "TEACHER",
}


GET /api/invites/:token

Validates invite.

Returns:

{
  valid: true,
  workspace: {
    name: "Greenspring School"
  },
  role: "TEACHER",
  email: "teacher@gmail.com"
}

POST /api/invites/complete

Completes registration.

Input:

{
  token,
  user_name,
  password
}


help me restructure the invite api and schema model for invite , @contextScopeItemMention ,  @contextScopeItemMention , i want this @contextScopeItemMention to have a button at the center if there is no invite  and if there is show all the invites in a table  likr  Email	Role	Status	Sent
teacher@gmail.com
	Teacher	Pending	2 hours ago

Actions:

resend
revoke
copy link,  and they will be able to invite admin too ,  this are the expected endpoints , @contextScopeItemMention , not for even they will be using POST /api/invites/complete for completing the registration in @contextScopeItemMention , after that they get sent to /dashboard or . /workspace  , based on roles,                    when they clcik invite in the invitation page , after input the email the POST /api/invites after creating the invite will send an email to the invited email  with this format  Hello,

You’ve been invited to join a workspace on LearningDeck.

Role: Teacher
Workspace: Kings College CBT Workspace

Complete your registration below:

https://www.learningdeck.online/invite/INVITE_TOKEN

This invite expires in 7 days.

— LearningDeck