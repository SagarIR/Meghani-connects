# Generated manually for payment_details and profit default
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sale',
            name='payment_details',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='sale',
            name='profit',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
