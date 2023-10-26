Linked Role Metadata to be one-off PUT to `https://discord.com/api/v10/applications/CLIENTID/role-connections/metadata`

Header:
Authorization: Bot [TOKEN]

Body:

```
[
	{
		"key": "kms",
		"name": "Kilometers Driven",
		"description": "Kilometers Driven",
		"type": 3
	},
	{
		"key": "jobs",
		"name": "Jobs Completed",
		"description": "Jobs Completed",
		"type": 3
	}
]
```
