Angular-Bootstrap
=================

Angular-Bootstrap tries to provide a bridge to fill the gap between [AngularJS] [1]'s user community and the many
excellent tools available to [Twitter's Bootstrap] [2]'s users.

This is done by creating highly customizable custom AngularJS tags as an extension to HTML5 which will enable you
to rapidly design Bootstrap-enabled application.

For each directive, samples are provided in `/sample`. To demonstrate, though, here is a simple `dropdown` definition:

    <ui:dropdown id="commitMenu" label="Commit" kind="normal" caret="true" size="large" glyph="asterisk" position="before">
        <ui:dropdown-header glyph="upload">Commit</ui:dropdown-header>
        <ui:dropdown-item href="commit-master" glyph="cloud-upload">Commit to master</ui:dropdown-item>
        <ui:dropdown-item href="commit-other" glyph="asterisk">Commit to other ...</ui:dropdown-item>
        <ui:dropdown-divider></ui:dropdown-divider>
        <ui:dropdown-item disabled="true" href="project/home" glyph="ban-circle">Discard</ui:dropdown-item>
    </ui:dropdown>

Which will generate the HTML snippet:

    <div class="dropdown" id="commitMenu" label="Commit" kind="normal" caret="true" size="large" glyph="asterisk" position="after">
        <a class="btn dropdown-toggle btn-default btn-lg" type="button" id="commitMenu" data-toggle="dropdown">
            <span class="glyphicon glyphicon-asterisk"></span> Commit
            <span class="caret"></span>
        </a>
        <ul class="dropdown-menu" role="menu" aria-labelledby="commitMenu">
                <li role="presentation" class="dropdown-header"><span class="glyphicon glyphicon-upload"></span>
                    <span>Commit</span></li>
                <li href="commit-master" glyph="cloud-upload"><a role="menuitem" tabindex="-1" class="btn-link">
                    <span class="glyphicon glyphicon-cloud-upload"></span> <span>Commit to master</span></a></li>
                <li role="presentation" href="commit-other" glyph="asterisk"><a role="menuitem" tabindex="-1"
                    class="btn-link"><span class="glyphicon glyphicon-asterisk"></span> <span>Commit to other ...
                    </span></a></li>
                <li role="presentation" class="divider"></li>
                <li role="presentation" disabled="disabled" href="project/home" glyph="ban-circle" class="disabled">
                    <a role="menuitem" tabindex="-1"  class="btn-link"><span class="glyphicon glyphicon-ban-circle"></span>
                    <span>Discard</span></a></li>
            </ul>
    </div>

Which is unwieldy and full of unnecessary markup that is only meaningful for Bootstrap.

**! Note** The above code snippet is for demonstration purposes only and might not be an accurate of what the system
is actually generating.

You are encouraged to refer to the documentation for each specific directive to see exactly how it should be used and
what it options are.

Feature Requests
----------------

You are welcome to request features to be added, as long as they are reasonable and fit within the boundaries of this
system. Features should be feasible through a DSL-like interface and should contribute to the general ease-of-use of
the framework.

Extending the Code
------------------

You are also free to extend the code, as long as you keep the original credits. Pull requests will be considered very
quickly, as I am very much on the lookout for co-contributors to the project.

The Extras
----------

With **Angular-Bootstrap**'s extensive set of HTML addons, there comes a nicely built set of JavaScript tools and facilities.
They are -- or will be -- documented for the most part. Check them out. Many of them might be duplicates of what is already
available out there.

If you can replace any of the code internal to **Angular-Bootstrap** with external libraries without adding to the general
size of the system, you are welcome to do so.

Browser Compatibility
---------------------

**Angular-Bootstrap** has been tested with Firefox, Safari, and Chrome, as they are the ones available to me. I am sure
that any inconsistencies with the minimum requirements imposed by [AngularJS][1] can be fixed, given that I am made aware
of it.

  [1]: http://angularjs.org/        "AngularJS's Homepage"
  [2]: http://getbootstrap.com/     "Twitter Bootstrap Homepage"