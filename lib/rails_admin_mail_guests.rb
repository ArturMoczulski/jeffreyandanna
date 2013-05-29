require 'rails_admin/config/actions'
require 'rails_admin/config/actions/base'

module RailsAdminMailGuests
end

module RailsAdmin
  module Config
    module Actions
      class MailGuests < Base
        RailsAdmin::Config::Actions.register(self)
        register_instance_option :root? do
          true
        end

        register_instance_option :controller do
          Proc.new do
            @options = [['Self (for testing)', 'self'],
                        ['Broken address (for testing)', 'broken'],
                        ['Attending', 'attending'],
                        ['Responded', 'responded'],
                        ['Not Attending', 'not_attending'],
                        ['Not Responded', 'not_responded']]
            if request.method == 'GET'
            elsif request.method == 'POST'
              if params[:mail][:group] == 'self' || params[:mail][:group] == 'broken'
                email = params[:mail][:group] == 'self' ? current_user.email : 'broken@blah.nope'
                invitation = Invitation.new(email: email, address: '123 Main St\nSan Francisco, CA')
                guest = Guest.new(name: email)
                invitation.guests << guest
                invitation.generate_rsvp
                InvitationMailer.invitation_email(invitation, params[:mail][:subject], params[:mail][:body]).deliver
                flash.alert = 'Mail sent to your email address.'
              elsif @options.map{|option| option[1]}.include? params[:mail][:group]
                invitations = Invitation.send(params[:mail][:group]).where('email != ""')
                invitations.each do |invitation|
                  InvitationMailer.delay.invitation_email(invitation, params[:mail][:subject], params[:mail][:body])
                end
                flash.alert = 'Mail sent to guests.'
              else
                flash.notice = 'No don\'t :('
              end
              redirect_to back_or_index
            end
          end
        end

        register_instance_option :link_icon do
          'icon-envelope'
        end

        register_instance_option :http_methods do
          [:get, :post]
        end
      end
    end
  end
end