# DonateNow
------------------------------------------

A little webapp made for doing real-life crowd-funding at events.

## Why ?

I have been on different events where the organizers "crowd-funded" their projects. I mean, literally crowd-funding; not like the crowd-funding we are seeing now on the internet. On some occasions, there is a person in charge of presenting of the projects to fund, and then s/he might start off the donations by asking who's ready to give "amount x", waiting for someone to say "I will". Then all donations are "announced" out loud.

I guess there are a few problems with this :

* Donors are not anonymous
* The donated amounts are not secret
* In the setup explained above, some people might change their mind and not donate because they would be the "least generous" and everyone would know it... (That was over-simplified and badly explained, sorry for that)

## What's DonateNow ?

The goal is to DonateNow limit the issues listed above. Here is how it works :

1. When your guests arrive, they are given numbers on little piece of paper (randomly, without knowing who's been given what number).
2. There would be a few members of the staff who would hold an smartphone or a tablet.
3. When a guest wants to donate, either they go to one of these staff members, or the latter comes to them. The guest shows him/her the number s/he'd been given and then says how much s/he'd like to donate
4. The staff uses the terminal in his/her hands to write the donor number and donated amount.
5. [Optional] If there is a screen set up to present projects details, it could be used to show the total donated amount at this point
6. The donors will then go to give their contact details and stuff. The promised amount could be looked up by the staff.

## Why not make the webapp available to all the guests ?

Limiting false/fake user input...

## Requirements

* [Node.js](http://nodejs.org/)
* [MongoDB](http://www.mongodb.org/)
* A computer that you would use as "server" at the event (with those two programs installed...)
* Some staff members equipped with a smartphone or a tablet
* A common wifi network on which these machines could communicate (obviously?)

## How to run it ?

Clone the repo, or download the [latest release](https://BatikhSouri/BatikhSouri/DonateNow/releases/). Then unzip it and navigate to it in the console/terminal then run `npm install`.

## License

I hereby place this code in the public domain.