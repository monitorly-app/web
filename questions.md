Actuellement l'utilisateur créer un compte, puis créer une organization, actuellement il est en free par defaut, donc il peut créer 3 organizations, et ajouter 3 serveurs maximum quelque soit l'organisation. S'il passe en pro, il peut créer autant d'organisation qu'il veut et ajouter maximum 10 servers par orga

en gros nous pensions mettre un plan par organization. en gros nous voulions un peu le même système que https://nightwatch.laravel.com/ du coup nous, l'utilisateur peux créer des organizations et ajouter des serveurs pour les monitorer, metrics, alarms, services, etc...

pour te résumer le pricing de nightwatch, l'utilisateur créer un compte, il choisi le plan, puis créer une orga, puis après ajoute des application

nous voulons le même principe mais pour notre saas de monitoring serveur


donc on facture toujours par orga, j'avais pensé à ceci aussi :

Free : 

Organisations : 3
Serveurs par organisation : 3
Membres par organisation : illimité
Fonctionnalités incluses : 

Monitoring standard (60 minutes)
10 métriques par serveur
Alertes illimitées
Support par email
Dashboard basique
Historique 7 jours

donc 9 serveurs au total

Pro : 

Organisations : 5
Serveurs par organisation : 10
Membres par organisation : illimité

Fonctionnalités incluses :

Monitoring haute fréquence (15 minutes)
100 métriques par serveur
Alertes illimitées
Support prioritaire
Dashboard avancé
Historique 30 jours
Push Notifications
SSO/SAML
API complète

donc 50 serveurs au total

Business : 

Organisations : Illimité
Serveurs par organisation : 50
Membres par organisation : illimité

Fonctionnalités incluses :

Monitoring en temps réel (1 minute)
Métriques illimitées
Alertes illimitées
Support téléphonique
Dashboard personnalisé
Historique illimité
Push Notifications
API complète
SSO/SAML
Rapports automatisés

Ilimité serveur

Questions :

Est-ce que cette solution pour un Saas est viable ?

Est-ce qu'il peux y avoir la possibilité que des users abuse surtout les gratuits? 