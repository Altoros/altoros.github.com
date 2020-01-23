---
layout: post
title: Running capybara tests in remote browsers
description: How to automatically test your application in real browsers
caconicalUrl: https://www.altoros.com/blog/running-capybara-tests-in-remote-browsers/
redirect_to:
  - https://www.altoros.com/blog/running-capybara-tests-in-remote-browsers/
author:
  name: Eugene Melnikov
  link: https://github.com/melnikaite
---

Hi colleagues.
Are you concerned about how your application works in IE?
Do you believe that checking in latest version using different modes for emulating previous versions is enough?
No way! Even is you skip some legacy versions you can face problems with lack of support json, html5 tags, ECMAScript, limit for css selectors and many other problems that can not be detected just by changing browser mode.
You will be surprised that some bugs can be reproduced only on certain platform and browser.
To find such problems I propose you run your capybara tests in remote browsers.

<!-- full start -->

## Using personal virtual machine

- Install virtual machine with desired browser. You can use your own distributive or [ievms](https://github.com/xdissent/ievms)
- Make sure java and desired browsers are installed on VM
- Run on VM [Selenium Server](http://docs.seleniumhq.org/download/)
{% highlight bash %}java –jar selenium-server-standalone-2.35.0.jar -role hub -multiWindow -browserSessionReuse{% endhighlight %}
- Run on VM webdriver
{% highlight bash %}java –jar selenium-server-standalone-2.35.0.jar -role webdriver -hub http://127.0.0.1:4444/grid/register -port 5555{% endhighlight %}
- Configure forwarding TCP port 4444 from host machine to guest machine.
- Add to spec_helper.rb
{% highlight ruby %}
if ENV["SELENIUM"] == 'remote'
   require 'selenium-webdriver'
    url = 'http://127.0.0.1:4444/wd/hub'
   capabilities = Selenium::WebDriver::Remote::Capabilities.internet_explorer
    Capybara.register_driver :remote_browser do |app|
     Capybara::Selenium::Driver.new(app,
                                    :browser => :remote, :url => url,
                                    :desired_capabilities => capabilities)
   end
    Capybara.server_port = 3010
   ip = `ifconfig | grep 'inet ' | grep -v 127.0.0.1 | cut -d ' ' -f2`.strip
   Capybara.app_host = http://#{ip}:#{Capybara.server_port}
   Capybara.current_driver = :remote_browser
   Capybara.javascript_driver = :remote_browser
 end
{% endhighlight %}
- Run tests
{% highlight bash %}SELENIUM=remote bundle exec rspec spec/features/{% endhighlight %}
- You can easily [change internet_explorer to chrome, firefox or something else](http://selenium.googlecode.com/svn/trunk/docs/api/rb/Selenium/WebDriver/Remote/Capabilities.html) and run tests again.

## Using browserstack

- Create account on [browserstack](http://www.browserstack.com)
- Download and put [BrowserStackTunnel.jar](http://www.browserstack.com/BrowserStackTunnel.jar) to spec/support/
- Make sure java and curl is installed on you machine
- Add to spec_helper.rb
{% highlight ruby %}
  if ENV["SELENIUM"] == 'browserstack'
    require 'selenium-webdriver'

    url = "https://#{AppConfig.browserstack['username']}:#{AppConfig.browserstack['accesskey']}@hub.browserstack.com/wd/hub"
    capabilities = Selenium::WebDriver::Remote::Capabilities.new
    capabilities['browser'] = ENV['browser'] || 'IE'
    capabilities['browser_version'] = ENV['browser_version'] || '8.0'
    capabilities['os'] = 'Windows'
    capabilities['os_version'] = '7'
    capabilities['browserstack.tunnel'] = 'true'
    capabilities['browserstack.debug'] = 'true'

    Capybara.register_driver :browser_stack do |app|
      Capybara::Selenium::Driver.new(app,
                                     :browser => :remote, :url => url,
                                     :desired_capabilities => capabilities)
    end

    Capybara.server_port = 3010
    Capybara.default_wait_time = 10
    Capybara.current_driver = :browser_stack
    Capybara.javascript_driver = :browser_stack

    RSpec.configure do |config|
      config.before(:all) do
        `java -jar spec/support/BrowserStackTunnel.jar #{AppConfig.browserstack['accesskey']} 127.0.0.1,#{Capybara.server_port},0 -v >log/browserstack.log 2>&1 &`
        visit '/'
        until (`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:45691`.to_i == 200)
          sleep 1
        end
      end
      config.after(:all) do
        `ps -ef | awk '/BrowserStackTunnel.*,#{Capybara.server_port},/{print $2}' | xargs kill -9`
      end
    end
  end
{% endhighlight %}
- Run tests
{% highlight bash %}SELENIUM=browserstack browser=IE browser_version=11.0 bundle exec rspec spec/features/{% endhighlight %}

## Assamption

Testing in remote browsers assume using selenium webdriver. So you should make sure all your tests are passed using selenium if previously you used webkit or something else.

## Conclusion

By using personal VM you have more control on your browsers, you can even change profiles of browsers and other [options](http://code.google.com/p/selenium/w/list).
But browserstack allows you run your tests on a lot of different combinations of [platforms and browsers](http://www.browserstack.com/list-of-browsers-and-platforms/automate) and even mobile emulators without any additional installations.
However speed of testing depends on network latency and selected plan.
Fortunately you can run tests in [several treads](http://www.browserstack.com/automate/ruby#parallel-tests) across different browsers or tests.
In additional browserstack gives you possibility to do live testing and debug your local application or folder with prototype.
You can even check responsiveness.

Guys, feel free to improve my integration capybara with browserstack.
I’ll be happy if it inspire someone on creation new gem.
You can ask any questions here or in [skype](skype:BrowserStack?chat) of browserstack support.

<!-- full end -->
