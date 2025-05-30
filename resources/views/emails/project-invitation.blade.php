<x-mail::message>
# You've been invited to join {{ $project->name }}

Hello!

**{{ $invitedBy->name }}** has invited you to join the **{{ $project->name }}** project as a **{{ $roleName }}**.

@if($project->description)
## About this project
{{ $project->description }}
@endif

## What's next?

Click the button below to accept the invitation and join the project. If you don't have an account yet, you'll be able to create one during the process.

<x-mail::button :url="$acceptUrl" color="primary">
Accept Invitation
</x-mail::button>

## Project Details

- **Project:** {{ $project->name }}
- **Your Role:** {{ $roleName }}
- **Invited by:** {{ $invitedBy->name }}
- **Invitation sent:** {{ $invitation->created_at->format('F j, Y') }}

---

If you're not interested in joining this project, you can simply ignore this email. The invitation will expire automatically after 7 days.

If you have any questions, please contact {{ $invitedBy->name }} directly at {{ $invitedBy->email }}.

Thanks,<br>
{{ config('app.name') }} Team

<x-mail::subcopy>
If you're having trouble clicking the "Accept Invitation" button, copy and paste the URL below into your web browser: [{{ $acceptUrl }}]({{ $acceptUrl }})
</x-mail::subcopy>
</x-mail::message>