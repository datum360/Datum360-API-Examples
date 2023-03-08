using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using oauth2_3legged.Data;
using Microsoft.AspNetCore.Authentication.OAuth;
using System.Text;
using Newtonsoft.Json;
using System.Security.Claims;
using Newtonsoft.Json.Linq;
using oauth2_3legged.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddDefaultIdentity<IdentityUser>(options => options.SignIn.RequireConfirmedAccount = true)
    .AddEntityFrameworkStores<ApplicationDbContext>();
builder.Services.AddRazorPages();

builder.Services.AddAuthentication()
    .AddOAuth("PIM360", config =>
{
    config.CallbackPath = "/oauth/callback";
    config.ClientId = "username";
    config.ClientSecret = "password";
    config.AuthorizationEndpoint = "https://example-system.acl360.io/oauth2/authorize";
    config.TokenEndpoint = "https://example-system.acl360.io/oauth2/token";
    config.SaveTokens = true;
    config.Scope.Add("example-system-pim360");

    config.Events = new OAuthEvents()
    {
        //Parsing the jwt token to get the capabilities
        OnCreatingTicket = context =>
        {
            var accessToken = context.AccessToken;
            var base64payload = accessToken.Split('.')[1];
            var bytes = Convert.FromBase64String(base64payload);
            var jsonPayload = Encoding.UTF8.GetString(bytes);
            var user = JsonConvert.DeserializeObject<Datum360Token>(jsonPayload);

            foreach (var claim in user.capabilities[0].capabilities)
            {
                context.Identity.AddClaim(new Claim(claim, claim));
            }

            return Task.CompletedTask;
        }
    };

});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();

app.Run();
